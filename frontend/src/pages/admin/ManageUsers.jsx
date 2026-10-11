import { useEffect, useState } from 'react';
import {
  CheckCircle,
  MoreVertical,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import adminService from '../../services/admin.service';
import { resolveAvatar } from '../../utils/avatar';

const PermissionToggle = ({ permission, isSelected, isFromRole, onToggle }) => (
  <button
    onClick={() => onToggle(permission.id)}
    className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border-2 ${
      isSelected
        ? 'bg-primary-50 border-primary-600 shadow-md shadow-primary-100'
        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
    }`}
  >
    <div className="flex flex-col items-start text-left">
      <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isSelected ? 'text-primary-600' : 'text-slate-400'}`}>
        {permission.codename.replace(/_/g, ' ')}
      </span>
      <span className="text-sm font-bold text-slate-700 mt-1">
        {translatePermission(permission.codename)}
      </span>
    </div>
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
      isSelected ? 'bg-primary-600 border-primary-600' : 'border-slate-200'
    }`}>
      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
    </div>
  </button>
);

const translatePermission = (codename) => {
  const map = {
    // Patient & Shared
    'view_appointment': 'عرض المواعيد',
    'add_appointment': 'حجز موعد جديد',
    'view_medicalrecord': 'عرض السجل الطبي',
    'add_review': 'إضافة تقييم',
    'view_review': 'عرض التقييمات',
    
    // Doctor Specific
    'change_appointment': 'تعديل حالة المواعيد',
    'add_medicalrecord': 'إنشاء سجل طبي',
    'change_medicalrecord': 'تعديل السجل الطبي',
    'add_patientdiagnosis': 'إضافة تشخيص طبي',
    'add_patientprescription': 'كتابة روشتة طبية',
    'add_doctorschedule': 'إعداد جدول العمل',
    'change_doctorschedule': 'تعديل جدول العمل',
    'view_patient': 'عرض بيانات المرضى',
    'view_user': 'عرض بيانات المستخدمين',
  };
  return map[codename] || codename;
};

const UserPermissionsModal = ({ user, onClose, onSave }) => {
  const [rolePermissions, setRolePermissions] = useState({ doctor: [], patient: [] });
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // التعريف الدقيق للصلاحيات المسموح بها لكل دور حسب طلب المستخدم
  const STRICT_PATIENT_PERMS = [
    'view_appointment', 
    'add_appointment', 
    'view_medicalrecord', 
    'add_review', 
    'view_review'
  ];

  const STRICT_DOCTOR_PERMS = [
    'view_appointment', 
    'change_appointment',
    'add_medicalrecord', 
    'change_medicalrecord',
    'add_patientdiagnosis', 
    'add_patientprescription',
    'add_doctorschedule', 
    'change_doctorschedule',
    'view_patient',
    'view_user'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [perms, roles] = await Promise.all([
          adminService.getAllPermissions(),
          adminService.getAllRoles(),
        ]);
        
        // تصفية الصلاحيات لتكون فقط المطلوبة وتجنب صلاحيات الـ delete أو الـ admin
        const drPerms = perms.filter(p => STRICT_DOCTOR_PERMS.includes(p.codename));
        const ptPerms = perms.filter(p => STRICT_PATIENT_PERMS.includes(p.codename));

        setRolePermissions({
          doctor: drPerms,
          patient: ptPerms,
        });

        // تحديد الصلاحيات المختارة حالياً للمستخدم
        const userPermIds = user.userPermissions.map(p => p.id);
        
        // الصلاحيات التي يمتلكها المستخدم بالفعل من خلال الـ Group الخاص به
        const userRole = user.role?.toLowerCase();
        const currentRolePerms = perms.filter(p => {
          if (userRole === 'doctor') return STRICT_DOCTOR_PERMS.includes(p.codename);
          if (userRole === 'patient') return STRICT_PATIENT_PERMS.includes(p.codename);
          return false;
        }).map(p => p.id);
        
        setSelectedPermissions(new Set([...currentRolePerms, ...userPermIds]));
      } catch (err) {
        setError('Failed to load permissions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleToggle = (id) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(user.id, Array.from(selectedPermissions));
      onClose();
    } catch (err) {
      setError('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-[32px] p-12 flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="font-bold text-slate-500">Loading permissions...</p>
        </div>
      </div>
    );
  }

  const isDoctor = user.role === 'doctor';
  const primaryPermissions = isDoctor ? rolePermissions.doctor : rolePermissions.patient;
  const secondaryPermissions = isDoctor ? rolePermissions.patient : rolePermissions.doctor;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20">
        {/* Header */}
        <div className="bg-white px-10 py-8 flex items-center justify-between border-b border-slate-100" dir="rtl">
          <div className="flex items-center space-x-5 space-x-reverse">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
              <Shield className="text-white w-9 h-9" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                إدارة صلاحيات <span className="text-primary-600 uppercase tracking-tight">{user.name}</span>
              </h2>
              <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest">
                دور المستخدم: {user.role === 'doctor' ? 'طبيب' : user.role === 'patient' ? 'مريض' : user.role}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10 space-y-12" dir="rtl">
          {error && (
            <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center space-x-3 space-x-reverse text-red-600 font-bold">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Role Permissions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center">
                <span className="w-2 h-6 bg-primary-600 rounded-full mr-3"></span>
                صلاحيات الـ {isDoctor ? 'طبيب' : 'مريض'} (أساسية)
              </h3>
              <span className="bg-primary-50 px-4 py-1.5 rounded-full text-[10px] font-black text-primary-600 border border-primary-100 uppercase tracking-widest">
                مفعلة تلقائياً لهذا الدور
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {primaryPermissions.map(perm => (
                <PermissionToggle
                  key={perm.id}
                  permission={perm}
                  isSelected={selectedPermissions.has(perm.id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </div>

          {/* Secondary Role Permissions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center">
                <span className="w-2 h-6 bg-slate-300 rounded-full mr-3"></span>
                صلاحيات إضافية (يمكن منحها للمستخدم)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {secondaryPermissions.map(perm => (
                <PermissionToggle
                  key={perm.id}
                  permission={perm}
                  isSelected={selectedPermissions.has(perm.id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-10 py-8 flex items-center justify-start space-x-4 space-x-reverse border-t border-slate-100" dir="rtl">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-10 py-4 bg-primary-600 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              'حفظ الصلاحيات'
            )}
          </button>
          <button
            onClick={onClose}
            className="px-8 py-4 text-sm font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

const UserRow = ({ user, onToggleStatus, onDelete, onManagePermissions }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="py-4 px-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shadow-sm">
            <img
              src={user.image}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = resolveAvatar(null);
              }}
            />
          </div>
          <div>
            <p className="font-bold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
          user.role === 'doctor'
            ? 'bg-purple-50 text-purple-600 border-purple-100'
            : user.role === 'admin'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-blue-50 text-blue-600 border-blue-100'
        }`}>
          {user.role || 'Not specified'}
        </span>
      </td>
      <td className="py-4 px-6">
        <span className={`flex items-center text-xs font-bold ${user.isActive ? 'text-green-500' : 'text-red-500'}`}>
          {user.isActive ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <ShieldAlert className="w-3 h-3 mr-1" />
              Inactive
            </>
          )}
        </span>
      </td>
      <td className="py-4 px-6 text-right relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {showMenu && (
          <div className="absolute right-6 top-12 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2 overflow-hidden">
            <button
              onClick={() => {
                onManagePermissions(user);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center"
            >
              <Shield className="w-4 h-4 mr-2 text-primary-600" />
              Manage Permissions
            </button>
            <button
              onClick={() => {
                onToggleStatus(user.id, !user.isActive);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center"
            >
              {user.isActive ? (
                <>
                  <UserX className="w-4 h-4 mr-2 text-red-500" />
                  Deactivate User
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2 text-green-500" />
                  Activate User
                </>
              )}
            </button>
            <button
              onClick={() => {
                onDelete(user.id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminService.getAllUsers();
        setUsers(data);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId, newStatus) => {
    try {
      await adminService.updateUser(userId, { is_active: newStatus });
      setUsers(users.map((user) => (user.id === userId ? { ...user, isActive: newStatus } : user)));
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminService.deleteUser(userId);
      setUsers(users.filter((user) => user.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleSavePermissions = async (userId, permissionIds) => {
    try {
      await adminService.updateUser(userId, { user_permission_ids: permissionIds });
      // Update local state
      const updatedUser = await adminService.getUserDetails(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, userPermissions: updatedUser.userPermissions } : u));
    } catch (error) {
      console.error('Failed to save permissions:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-slate-900 leading-tight">Manage Users</h1>
        <p className="text-slate-500 font-medium">View and manage all system accounts.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">User</th>
                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-4 px-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, index) => (
                  <tr key={index} className="animate-pulse h-16 bg-white" />
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteUser}
                    onManagePermissions={setSelectedUserForPerms}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500 font-medium">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUserForPerms && (
        <UserPermissionsModal
          user={selectedUserForPerms}
          onClose={() => setSelectedUserForPerms(null)}
          onSave={handleSavePermissions}
        />
      )}
    </div>
  );
};

export default ManageUsers;
