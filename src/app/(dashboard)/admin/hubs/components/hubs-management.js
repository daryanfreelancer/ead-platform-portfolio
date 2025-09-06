'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import { FileUpload } from '@/components/ui/file-upload'
import { Building2, Plus, Edit2, Trash2, Check, X, Globe, Upload } from 'lucide-react'

const supabase = createClient()

export default function HubsManagement({ initialHubs }) {
  const [hubs, setHubs] = useState(initialHubs)
  const [showForm, setShowForm] = useState(false)
  const [editingHub, setEditingHub] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    logo_url: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      website_url: '',
      logo_url: '',
      is_active: true
    })
    setEditingHub(null)
    setShowForm(false)
  }

  const handleEdit = (hub) => {
    setEditingHub(hub)
    setFormData({
      name: hub.name,
      description: hub.description || '',
      website_url: hub.website_url || '',
      logo_url: hub.logo_url || '',
      is_active: hub.is_active
    })
    setShowForm(true)
  }

  const handleLogoUpload = async (uploadResult) => {
    setFormData(prev => ({
      ...prev,
      logo_url: uploadResult.publicUrl
    }))
  }

  const handleLogoError = (error) => {
    console.error('Erro no upload do logo:', error)
    alert('Erro ao fazer upload do logo')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingHub) {
        // Atualizar polo existente
        const { data, error } = await supabase
          .from('educational_hubs')
          .update({
            name: formData.name,
            description: formData.description,
            website_url: formData.website_url,
            logo_url: formData.logo_url,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingHub.id)
          .select()
          .single()

        if (error) throw error

        setHubs(hubs.map(h => h.id === editingHub.id ? data : h))
      } else {
        // Criar novo polo
        const { data, error } = await supabase
          .from('educational_hubs')
          .insert([{
            name: formData.name,
            description: formData.description,
            website_url: formData.website_url,
            logo_url: formData.logo_url,
            is_active: formData.is_active
          }])
          .select()
          .single()

        if (error) throw error

        setHubs([data, ...hubs])
      }

      resetForm()
    } catch (error) {
      console.error('Erro ao salvar polo:', error)
      alert('Erro ao salvar polo educacional')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (hub) => {
    try {
      const { error } = await supabase
        .from('educational_hubs')
        .update({ 
          is_active: !hub.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', hub.id)

      if (error) throw error

      setHubs(hubs.map(h => 
        h.id === hub.id ? { ...h, is_active: !h.is_active } : h
      ))
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do polo')
    }
  }

  const handleDelete = async (hub) => {
    if (!confirm(`Tem certeza que deseja excluir o polo "${hub.name}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('educational_hubs')
        .delete()
        .eq('id', hub.id)

      if (error) throw error

      setHubs(hubs.filter(h => h.id !== hub.id))
    } catch (error) {
      console.error('Erro ao excluir polo:', error)
      alert('Erro ao excluir polo. Verifique se não há cursos associados.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Botão para adicionar novo polo */}
      {!showForm && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Polo Educacional
          </Button>
        </div>
      )}

      {/* Formulário de criação/edição */}
      {showForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">
            {editingHub ? 'Editar Polo Educacional' : 'Novo Polo Educacional'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Nome do Polo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: UniUnica"
                  required
                />
              </div>

              <div>
                <Label htmlFor="website_url">Website</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://www.exemplo.edu.br"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição sobre o polo educacional..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label>Logo do Polo</Label>
              {formData.logo_url ? (
                <div className="mt-2 flex items-center gap-4">
                  <img
                    src={formData.logo_url}
                    alt="Logo do polo"
                    className="h-20 w-auto object-contain bg-gray-50 p-2 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo_url: '' })}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remover logo
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  <FileUpload
                    bucket="public-assets"
                    path="hubs"
                    accept="image/*"
                    maxSize={5 * 1024 * 1024} // 5MB
                    onUpload={handleLogoUpload}
                    onError={handleLogoError}
                    className="h-32"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos: PNG, JPG, SVG. Máximo 5MB. Recomendado: fundo transparente
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Polo ativo</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Polos inativos não aparecem na seleção de cursos
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || uploadingLogo}
              >
                {loading ? 'Salvando...' : editingHub ? 'Atualizar' : 'Criar Polo'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de polos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubs.map((hub) => (
          <Card key={hub.id} className="relative overflow-hidden">
            {/* Status badge */}
            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-medium ${
              hub.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {hub.is_active ? 'Ativo' : 'Inativo'}
            </div>

            <div className="p-6">
              {/* Logo e nome */}
              <div className="flex items-start gap-4 mb-4">
                {hub.logo_url ? (
                  <img
                    src={hub.logo_url}
                    alt={`Logo ${hub.name}`}
                    className="h-16 w-16 object-contain bg-gray-50 p-2 rounded"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{hub.name}</h3>
                  {hub.website_url && (
                    <a
                      href={hub.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" />
                      Website
                    </a>
                  )}
                </div>
              </div>

              {/* Descrição */}
              {hub.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {hub.description}
                </p>
              )}

              {/* Ações */}
              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={() => handleToggleActive(hub)}
                  className={`text-sm font-medium ${
                    hub.is_active 
                      ? 'text-red-600 hover:text-red-800' 
                      : 'text-green-600 hover:text-green-800'
                  }`}
                >
                  {hub.is_active ? 'Desativar' : 'Ativar'}
                </button>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(hub)}
                    className="p-1 text-gray-600 hover:text-blue-600"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  {/* Não permitir excluir EduPlatform */}
                  {hub.name !== 'EduPlatform' && (
                    <button
                      onClick={() => handleDelete(hub)}
                      className="p-1 text-gray-600 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {hubs.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum polo educacional cadastrado</p>
        </div>
      )}
    </div>
  )
}