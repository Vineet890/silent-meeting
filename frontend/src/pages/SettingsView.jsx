import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function SettingsView() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [name, setName] = useState(user.name || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const res = await apiFetch('/api/user/rename', {
                method: 'PUT',
                body: JSON.stringify({ name })
            });
            if (res && res.ok) {
                const data = await res.json();
                localStorage.setItem('user', JSON.stringify(data.user));
                alert('Profile updated successfully!');
                window.location.reload(); 
            } else {
                alert('Failed to update profile.');
            }
        } catch (error) {
            console.error(error);
        }
        setIsUpdating(false);
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you ABSOLUTELY sure you want to permanently delete your account and all of your workspaces? This action cannot be undone.")) return;
        
        setIsDeleting(true);
        try {
            const res = await apiFetch('/api/user/delete', {
                method: 'DELETE'
            });
            if (res && res.ok) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                alert('Failed to delete account.');
            }
        } catch (error) {
            console.error(error);
        }
        setIsDeleting(false);
    };

    return (
        <div className="flex-1 w-full px-16 py-12">
            <div className="max-w-3xl mx-auto">
                <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
                <p className="mb-12 text-lg text-muted-foreground">Manage your profile and preferences.</p>

                <div className="p-8 mb-8 border bg-card text-card-foreground rounded-2xl shadow-sm">
                    <h3 className="mb-6 text-xl font-semibold tracking-tight">Profile Details</h3>
                    
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-foreground">Full Name</label>
                            <input 
                                type="text" 
                                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-foreground">Email Address</label>
                            <input type="email" className="flex h-12 w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm shadow-sm transition-colors opacity-70 cursor-not-allowed" defaultValue={user.email} disabled />
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="inline-flex items-center justify-center h-12 px-6 py-2 text-sm font-bold transition-all rounded-xl shadow bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50" disabled={isUpdating || name === user.name}>
                                {isUpdating ? 'Updating...' : 'Update Profile'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-2xl shadow-sm">
                    <h3 className="mb-4 text-xl font-semibold tracking-tight text-destructive">Account Management</h3>
                    <p className="mb-6 text-sm text-muted-foreground">If you no longer need your account, you can permanently delete it here. This will remove all your workspaces and data.</p>
                    <button 
                        onClick={handleDeleteAccount}
                        className="inline-flex items-center justify-center h-12 px-6 py-2 text-sm font-bold transition-all rounded-xl shadow bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:pointer-events-none disabled:opacity-50" 
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SettingsView;
