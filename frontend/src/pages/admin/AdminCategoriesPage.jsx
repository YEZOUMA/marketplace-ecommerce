import { useEffect, useState, useCallback } from 'react';
import { listCategories, createCategory, deleteCategory } from '../../api/categories.js';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [nom, setNom] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setCategories(await listCategories());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createCategory({ nom });
      setNom('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de la création');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await deleteCategory(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Échec de la suppression');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Catégories</h2>

      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
        <input
          required
          placeholder="Nouvelle catégorie"
          className="border rounded-md px-3 py-2 flex-1"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700">
          Ajouter
        </button>
      </form>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="bg-white border rounded-lg divide-y">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3">
            <span>{c.nom}</span>
            <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline text-sm">
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
