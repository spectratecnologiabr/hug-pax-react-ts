import React, { useEffect, useMemo, useState } from 'react'
import Menubar from '../components/admin/menubar'
import {
  createTag,
  createTagCategory,
  listTagCategories,
  listTagCloud,
  listTags,
  updateTag,
  updateTagCategory
} from '../controllers/lessonTags/lessonTags.controller'
import '../style/adminLessonTagsPage.css'

type Role = 'educator' | 'consultant' | 'coordinator' | 'admin'
type ModalMode = 'create' | 'edit'

const roleOptions: Role[] = ['educator', 'consultant', 'coordinator', 'admin']

const emptyCategoryForm = {
  id: 0,
  name: '',
  slug: '',
  color: '#3696D3',
  priority: 0,
  isActive: true,
  visibleRoles: [] as Role[]
}

const emptyTagForm = {
  id: 0,
  categoryId: '',
  name: '',
  slug: '',
  priority: 0,
  isActive: true
}

function parseRoles(value: any): Role[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => String(v || '').trim().toLowerCase())
    .filter((v): v is Role => roleOptions.includes(v as Role))
}

function AdminLessonTagsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [categories, setCategories] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [cloud, setCloud] = useState<any[]>([])

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryModalMode, setCategoryModalMode] = useState<ModalMode>('create')
  const [categoryForm, setCategoryForm] = useState({ ...emptyCategoryForm })

  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [tagModalMode, setTagModalMode] = useState<ModalMode>('create')
  const [tagForm, setTagForm] = useState({ ...emptyTagForm })

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [categoriesData, tagsData, cloudData] = await Promise.all([
        listTagCategories(true),
        listTags({ includeInactive: true }),
        listTagCloud()
      ])
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      setTags(Array.isArray(tagsData) ? tagsData : [])
      setCloud(Array.isArray(cloudData) ? cloudData : [])
    } catch (e: any) {
      setError(String(e?.response?.data?.message || e?.message || 'Erro ao carregar dados'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const cloudByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    for (const item of cloud) {
      const key = String(item.categoryName || 'Sem categoria')
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(item)
    }
    return grouped
  }, [cloud])

  function openCreateCategory() {
    setCategoryModalMode('create')
    setCategoryForm({ ...emptyCategoryForm })
    setCategoryModalOpen(true)
  }

  function openEditCategory(category: any) {
    setCategoryModalMode('edit')
    setCategoryForm({
      id: Number(category.id),
      name: String(category.name || ''),
      slug: String(category.slug || ''),
      color: String(category.color || '#3696D3'),
      priority: Number(category.priority || 0),
      isActive: category.isActive !== false,
      visibleRoles: parseRoles(category.visibleRoles)
    })
    setCategoryModalOpen(true)
  }

  function openCreateTag() {
    setTagModalMode('create')
    setTagForm({ ...emptyTagForm })
    setTagModalOpen(true)
  }

  function openEditTag(tag: any) {
    setTagModalMode('edit')
    setTagForm({
      id: Number(tag.id),
      categoryId: String(tag.categoryId || ''),
      name: String(tag.name || ''),
      slug: String(tag.slug || ''),
      priority: Number(tag.priority || 0),
      isActive: tag.isActive !== false
    })
    setTagModalOpen(true)
  }

  async function handleCategorySubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug,
        color: categoryForm.color,
        priority: Number(categoryForm.priority || 0),
        isActive: categoryForm.isActive,
        visibleRoles: categoryForm.visibleRoles
      }

      if (categoryModalMode === 'create') {
        await createTagCategory(payload)
        setSuccess('Categoria criada com sucesso.')
      } else {
        await updateTagCategory(Number(categoryForm.id), payload)
        setSuccess('Categoria atualizada com sucesso.')
      }

      setCategoryModalOpen(false)
      await loadAll()
    } catch (e: any) {
      setError(String(e?.response?.data?.message || e?.message || 'Erro ao salvar categoria'))
    }
  }

  async function handleTagSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const payload = {
        categoryId: Number(tagForm.categoryId),
        name: tagForm.name,
        slug: tagForm.slug,
        priority: Number(tagForm.priority || 0),
        isActive: tagForm.isActive
      }

      if (tagModalMode === 'create') {
        await createTag(payload)
        setSuccess('Tag criada com sucesso.')
      } else {
        await updateTag(Number(tagForm.id), payload)
        setSuccess('Tag atualizada com sucesso.')
      }

      setTagModalOpen(false)
      await loadAll()
    } catch (e: any) {
      setError(String(e?.response?.data?.message || e?.message || 'Erro ao salvar tag'))
    }
  }

  return (
    <div className="admin-dashboard-container">
      <Menubar />
      <div className="admin-dashboard-wrapper">
        <div className="tags-page">
          <div className="tags-header-row">
            <div className="tags-header">
              <b>Categorias e Tags de Busca</b>
              <span>Organize a taxonomia para busca por prioridade, cores e visibilidade por perfil.</span>
            </div>
            <div className="tags-actions">
              <button type="button" onClick={openCreateCategory}>Nova categoria</button>
              <button type="button" onClick={openCreateTag}>Nova tag</button>
            </div>
          </div>

          {loading && <div className="tags-feedback">Carregando...</div>}
          {error && <div className="tags-feedback error">{error}</div>}
          {success && <div className="tags-feedback success">{success}</div>}

          <section className="tags-card">
            <div className="tags-card-head">
              <h3>Categorias</h3>
              <span>{categories.length} cadastrada(s)</span>
            </div>
            <div className="categories-list">
              {categories.map(category => (
                <div key={`category-row-${category.id}`} className="category-row">
                  <div className="category-row-main">
                    <span className="category-color" style={{ background: category.color || '#3696D3' }} />
                    <div className="category-info">
                      <b>{category.name}</b>
                      <small>{category.slug}</small>
                    </div>
                  </div>
                  <div className="category-row-meta">
                    <span>Prioridade {Number(category.priority || 0)}</span>
                    <span>{category.isActive !== false ? 'Ativa' : 'Inativa'}</span>
                    <span>Perfis: {parseRoles(category.visibleRoles).join(', ') || 'Todos'}</span>
                  </div>
                  <button type="button" className="row-edit" onClick={() => openEditCategory(category)}>Editar</button>
                </div>
              ))}
            </div>
          </section>

          <section className="tags-card">
            <div className="tags-card-head">
              <h3>Tags</h3>
              <span>{tags.length} cadastrada(s)</span>
            </div>
            <div className="tags-list">
              {tags.map(tag => (
                <div key={`tag-row-${tag.id}`} className="tag-row">
                  <div className="tag-row-main">
                    <span className="tag-row-category" style={{ backgroundColor: tag.categoryColor || '#3696D3' }}>
                      {tag.categoryName}
                    </span>
                    <div className="tag-info">
                      <b>{tag.name}</b>
                      <small>{tag.slug}</small>
                    </div>
                  </div>
                  <div className="tag-row-meta">
                    <span>Prioridade {Number(tag.priority || 0)}</span>
                    <span>{tag.isActive !== false ? 'Ativa' : 'Inativa'}</span>
                  </div>
                  <button type="button" className="row-edit" onClick={() => openEditTag(tag)}>Editar</button>
                </div>
              ))}
            </div>
          </section>

          <section className="tags-card">
            <div className="tags-card-head">
              <h3>Tags Cloud (ordem por prioridade)</h3>
            </div>
            <div className="cloud-groups">
              {Object.entries(cloudByCategory).map(([categoryName, items]) => (
                <div key={`cloud-${categoryName}`} className="cloud-group">
                  <b>{categoryName}</b>
                  <div className="cloud-wrap">
                    {(items as any[]).map(tag => (
                      <span
                        key={`tag-cloud-${tag.id}`}
                        className="tag-chip"
                        style={{ backgroundColor: tag.categoryColor || '#3696D3' }}
                        title={`Prioridade ${tag.priority}`}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {categoryModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && setCategoryModalOpen(false)}>
          <div className="modal-content tags-modal">
            <div className="title-wrapper">
              <b>{categoryModalMode === 'create' ? 'Nova categoria' : 'Editar categoria'}</b>
            </div>
            <form onSubmit={handleCategorySubmit} className="form-grid">
              <div className="input-wrapper">
                <label>Nome</label>
                <input value={categoryForm.name} onChange={(event) => setCategoryForm(prev => ({ ...prev, name: event.target.value }))} />
              </div>
              <div className="input-wrapper">
                <label>Slug (opcional)</label>
                <input value={categoryForm.slug} onChange={(event) => setCategoryForm(prev => ({ ...prev, slug: event.target.value }))} />
              </div>
              <div className="input-wrapper">
                <label>Cor</label>
                <input type="color" value={categoryForm.color} onChange={(event) => setCategoryForm(prev => ({ ...prev, color: event.target.value }))} />
              </div>
              <div className="input-wrapper">
                <label>Prioridade</label>
                <input type="number" value={categoryForm.priority} onChange={(event) => setCategoryForm(prev => ({ ...prev, priority: Number(event.target.value || 0) }))} />
              </div>
              <div className="input-wrapper tags-full-width">
                <label>Perfis com visibilidade</label>
                <div className="roles-grid">
                  {roleOptions.map(role => (
                    <label key={`modal-category-role-${role}`} className="checkbox-inline">
                      <input
                        type="checkbox"
                        checked={categoryForm.visibleRoles.includes(role)}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...categoryForm.visibleRoles, role]
                            : categoryForm.visibleRoles.filter(item => item !== role)
                          setCategoryForm(prev => ({ ...prev, visibleRoles: Array.from(new Set(next)) }))
                        }}
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="input-wrapper tags-full-width">
                <label className="checkbox-inline">
                  <input type="checkbox" checked={categoryForm.isActive} onChange={(event) => setCategoryForm(prev => ({ ...prev, isActive: event.target.checked }))} />
                  <span>Categoria ativa</span>
                </label>
              </div>
              <div className="button-wrapper tags-full-width">
                <button className="submit-button" type="submit">Salvar</button>
                <button className="secondary-button" type="button" onClick={() => setCategoryModalOpen(false)}>Fechar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tagModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && setTagModalOpen(false)}>
          <div className="modal-content tags-modal">
            <div className="title-wrapper">
              <b>{tagModalMode === 'create' ? 'Nova tag' : 'Editar tag'}</b>
            </div>
            <form onSubmit={handleTagSubmit} className="form-grid">
              <div className="input-wrapper">
                <label>Categoria</label>
                <select value={tagForm.categoryId} onChange={(event) => setTagForm(prev => ({ ...prev, categoryId: event.target.value }))}>
                  <option value="">Selecione</option>
                  {categories.map(category => (
                    <option key={`modal-tag-category-${category.id}`} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-wrapper">
                <label>Nome</label>
                <input value={tagForm.name} onChange={(event) => setTagForm(prev => ({ ...prev, name: event.target.value }))} />
              </div>
              <div className="input-wrapper">
                <label>Slug (opcional)</label>
                <input value={tagForm.slug} onChange={(event) => setTagForm(prev => ({ ...prev, slug: event.target.value }))} />
              </div>
              <div className="input-wrapper">
                <label>Prioridade</label>
                <input type="number" value={tagForm.priority} onChange={(event) => setTagForm(prev => ({ ...prev, priority: Number(event.target.value || 0) }))} />
              </div>
              <div className="input-wrapper tags-full-width">
                <label className="checkbox-inline">
                  <input type="checkbox" checked={tagForm.isActive} onChange={(event) => setTagForm(prev => ({ ...prev, isActive: event.target.checked }))} />
                  <span>Tag ativa</span>
                </label>
              </div>
              <div className="button-wrapper tags-full-width">
                <button className="submit-button" type="submit">Salvar</button>
                <button className="secondary-button" type="button" onClick={() => setTagModalOpen(false)}>Fechar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLessonTagsPage
