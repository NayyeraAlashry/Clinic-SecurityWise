import { useEffect, useState } from 'react';
import { Shield, Save, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import adminService from '../../services/admin.service';

const PermissionToggle = ({ permission, isSelected, onToggle }) => (
  <button
    onClick={() => onToggle(permission.id)}
    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left ${
      isSelected
        ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm'
        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
    }`}
  >
    <div className="flex flex-col">
      <span className="text-sm font-bold">{permission.name}</span>
      <span className="text-[10px] opacity-60 uppercase tracking-tighter">{permission.codename}</span>
    </div>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
      isSelected ? 'bg-primary-600 border-primary-600' : 'border-slate-200'
    }`}>
      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
    </div>
  </button>
);

const ROLE_PERMISSIONS_MAP = {
  Doctor: [
    'view_appointment', 'change_appointment',
    'view_medicalrecord', 'add_medicalrecord', 'change_medicalrecord',
    'add_patientdiagnosis', 'change_patientdiagnosis',
    'add_patientprescription', 'change_patientprescription',
    'view_doctorschedule', 'add_doctorschedule', 'change_doctorschedule',
    'view_notification'
  ],
  Patient: [
    'view_appointment', 'add_appointment', 
    'view_medicalrecord', 
    'add_review', 'view_review',
    'view_notification'
  ]
};

const ManagePermissions = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        adminService.getAllRoles(),
        adminService.getAllPermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
      if (rolesData.length > 0) {
        handleSelectRole(rolesData[0]);
      }
    } catch (err) {
      setError('Failed to fetch permissions data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setRolePermissions(new Set(role.permissions.map(p => p.id)));
    setSuccess(null);
    setError(null);
  };

  const handleTogglePermission = (permissionId) => {
    setRolePermissions(prev => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      setError(null);
      await adminService.updateRolePermissions(selectedRole.id, Array.from(rolePermissions));
      
      // Update local roles state
      setRoles(prev => prev.map(r => 
        r.id === selectedRole.id 
          ? { ...r, permissions: permissions.filter(p => rolePermissions.has(p.id)) }
          : r
      ));
      
      setSuccess('Permissions updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update permissions');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading permissions...</p>
      </div>
    );
  }

  // Filter and Group permissions by app_label
  const displayedPermissions = permissions.filter(perm => {
    const allowed = ROLE_PERMISSIONS_MAP[selectedRole?.name];
    if (!allowed) return true;
    return allowed.includes(perm.codename);
  });

  const groupedPermissions = displayedPermissions.reduce((acc, perm) => {
    const group = perm.app_label || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
            <Shield className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manage Permissions</h1>
            <p className="text-slate-500 font-medium">Configure what each user type can do</p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving || !selectedRole}
          className="flex items-center justify-center space-x-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>Save Changes</span>
        </button>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-2xl flex items-center space-x-3 border ${
          error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'
        }`}>
          {error ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="font-bold text-sm">{error || success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Roles Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">User Types</p>
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 ${
                  selectedRole?.id === role.id
                    ? 'bg-white border-2 border-primary-600 shadow-xl shadow-primary-50 translate-x-2'
                    : 'bg-slate-100/50 border-2 border-transparent text-slate-600 hover:bg-white hover:border-slate-200'
                }`}
              >
                <span className="font-black text-sm uppercase tracking-wider">{role.name}</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${
                  selectedRole?.id === role.id ? 'rotate-0' : '-rotate-90 opacity-0 group-hover:opacity-100'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-3 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm min-h-[500px]">
          {selectedRole ? (
            <div className="space-y-10">
              <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Permissions for <span className="text-primary-600 uppercase tracking-wider">{selectedRole.name}</span>
                  </h2>
                  <p className="text-slate-400 text-xs font-bold mt-1">
                    {rolePermissions.size} permissions selected
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setRolePermissions(new Set())}
                    className="text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <div key={group} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {perms.map((perm) => (
                        <PermissionToggle
                          key={perm.id}
                          permission={perm}
                          isSelected={rolePermissions.has(perm.id)}
                          onToggle={handleTogglePermission}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <Shield className="w-16 h-16 opacity-20" />
              <p className="font-bold">Select a user type to manage permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePermissions;
