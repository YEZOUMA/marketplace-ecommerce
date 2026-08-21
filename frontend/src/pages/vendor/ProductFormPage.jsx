import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listCategories } from '../../api/categories.js';
import { createProduct, updateProduct, getProduct, uploadImages } from '../../api/products.js';

const emptyForm = { nom: '', description: '', prix: '', stock: '0', categorieId: '' };

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]); // [{url, ordre}]
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listCategories().then(setCategories);
    if (isEdit) {
      getProduct(id).then((p) => {
        setForm({ nom: p.nom, description: p.description, prix: p.prix, stock: p.stock, categorieId: p.categorieId || '' });
        setImages(p.images.map((img) => ({ url: img.url, ordre: img.ordre })));
      });
    }
  }, [id, isEdit]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const { urls } = await uploadImages(files);
      setImages((prev) => [...prev, ...urls.map((url, idx) => ({ url, ordre: prev.length + idx }))]);
    } catch (err) {
      setError(err.response?.data?.error || 'Échec du téléversement des images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url) => setImages((prev) => prev.filter((img) => img.url !== url));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        nom: form.nom,
        description: form.description,
        prix: Number(form.prix),
        stock: Number(form.stock),
        categorieId: form.categorieId || undefined,
        images,
      };
      if (isEdit) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      navigate('/vendeur/produits');
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de l\'enregistrement du produit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h2>
      {!isEdit && (
        <p className="text-sm text-gray-500 mb-4">
          Le produit sera créé en brouillon. Il ne sera visible des clients qu'après paiement des frais
          de publication.
        </p>
      )}
      {error && <p className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nom du produit</label>
          <input
            required
            className="w-full border rounded-md px-3 py-2"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            required
            rows={4}
            minLength={10}
            className="w-full border rounded-md px-3 py-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prix (XOF)</label>
            <input
              type="number"
              min={0}
              required
              className="w-full border rounded-md px-3 py-2"
              value={form.prix}
              onChange={(e) => setForm({ ...form, prix: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input
              type="number"
              min={0}
              required
              className="w-full border rounded-md px-3 py-2"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Catégorie</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={form.categorieId}
            onChange={(e) => setForm({ ...form, categorieId: e.target.value })}
          >
            <option value="">Aucune</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Images (max 8)</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleFileChange} />
          {uploading && <p className="text-sm text-gray-500 mt-1">Téléversement...</p>}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {images.map((img) => (
                <div key={img.url} className="relative w-20 h-20">
                  <img src={img.url} alt="" className="w-full h-full object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeImage(img.url)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-brand-600 text-white py-2.5 rounded-md hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Créer le produit'}
        </button>
      </form>
    </div>
  );
}
