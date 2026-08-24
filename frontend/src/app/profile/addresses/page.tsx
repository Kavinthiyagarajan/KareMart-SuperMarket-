'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { api, Address } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const addressSchema = z.object({
  type: z.enum(['HOME', 'WORK', 'OTHER']),
  recipientName: z.string().min(2, "Name is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  addressLine1: z.string().min(5, "Address Line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pinCode: z.string().min(6, "Valid PIN code is required"),
  isDefault: z.boolean().default(false)
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [zodErrors, setZodErrors] = useState<Record<string, string>>({});

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<AddressFormData>({
    defaultValues: { type: 'HOME', isDefault: false }
  });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const myAddresses = await api.getAddresses();
      setAddresses(myAddresses);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    fetchAddresses();
  }, [token, router]);

  const onSubmit = async (data: AddressFormData) => {
    try {
      setZodErrors({});
      addressSchema.parse(data);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        (e as any).errors.forEach((err: any) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setZodErrors(errors);
        return;
      }
    }

    try {
      if (editingId) {
        await api.updateAddress(editingId, data);
      } else {
        await api.createAddress(data);
      }
      setIsEditing(false);
      setEditingId(null);
      reset();
      fetchAddresses();
    } catch (error) {
      console.error("Failed to save address", error);
    }
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id);
    reset({
      type: addr.type,
      recipientName: addr.recipientName,
      phoneNumber: addr.phoneNumber,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      pinCode: addr.pinCode,
      isDefault: addr.isDefault
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.deleteAddress(id);
      fetchAddresses();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.setDefaultAddress(id);
      fetchAddresses();
    } catch (e) {
      console.error(e);
    }
  };

  if (!token) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
        <h3 className="text-xl font-bold text-slate-900">Saved Addresses</h3>
        {!isEditing && (
          <button 
            onClick={() => { reset(); setEditingId(null); setIsEditing(true); }}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg transition-colors"
          >
            + Add New
          </button>
        )}
      </div>

      <div className="p-6">

      {isEditing && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Address Type</label>
                <select {...register('type')} className="w-full border p-2 rounded focus:ring-emerald-500">
                  <option value="HOME">Home</option>
                  <option value="WORK">Work</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recipient Name</label>
                <input {...register('recipientName')} className="w-full border p-2 rounded focus:ring-emerald-500" />
                {zodErrors.recipientName && <p className="text-red-500 text-xs mt-1">{zodErrors.recipientName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input {...register('phoneNumber')} className="w-full border p-2 rounded focus:ring-emerald-500" />
                {zodErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{zodErrors.phoneNumber}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address Line 1</label>
                <input {...register('addressLine1')} className="w-full border p-2 rounded focus:ring-emerald-500" />
                {zodErrors.addressLine1 && <p className="text-red-500 text-xs mt-1">{zodErrors.addressLine1}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address Line 2 (Optional)</label>
                <input {...register('addressLine2')} className="w-full border p-2 rounded focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input {...register('city')} className="w-full border p-2 rounded focus:ring-emerald-500" />
                {zodErrors.city && <p className="text-red-500 text-xs mt-1">{zodErrors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input {...register('state')} className="w-full border p-2 rounded focus:ring-emerald-500" />
                {zodErrors.state && <p className="text-red-500 text-xs mt-1">{zodErrors.state}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PIN Code</label>
                <input {...register('pinCode')} className="w-full border p-2 rounded focus:ring-emerald-500" />
                {zodErrors.pinCode && <p className="text-red-500 text-xs mt-1">{zodErrors.pinCode}</p>}
              </div>
              <div className="flex items-center mt-4">
                <input type="checkbox" {...register('isDefault')} id="isDefault" className="mr-2" />
                <label htmlFor="isDefault" className="text-sm font-medium">Set as Default Address</label>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={isSubmitting} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {isSubmitting ? 'Saving...' : 'Save Address'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-lg font-medium border hover:bg-gray-50 transition-colors text-black dark:text-white">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8">Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 mb-4">You haven't saved any addresses yet.</p>
              <button 
                onClick={() => { reset(); setEditingId(null); setIsEditing(true); }}
                className="text-emerald-600 font-medium hover:underline"
              >
                Add your first address
              </button>
            </div>
          ) : (
            addresses.map(addr => (
              <div key={addr.id} className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow border ${addr.isDefault ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200 dark:border-gray-700'} relative`}>
                {addr.isDefault && (
                  <span className="absolute -top-3 right-4 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                    DEFAULT
                  </span>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold px-2 py-1 rounded">
                      {addr.type}
                    </span>
                    <h3 className="font-bold text-gray-900 dark:text-white">{addr.recipientName}</h3>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{addr.addressLine1}</p>
                {addr.addressLine2 && <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{addr.addressLine2}</p>}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{addr.city}, {addr.state} {addr.pinCode}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Phone: {addr.phoneNumber}</p>

                {addr.isServiceable !== undefined && (
                  <div className={`text-sm font-medium px-3 py-2 rounded-lg mb-4 ${addr.isServiceable ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {addr.isServiceable ? '✓ Serviceable' : `✗ Not Serviceable: ${addr.unserviceableReason}`}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => handleEdit(addr)} className="text-sm text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(addr.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr.id)} className="text-sm text-gray-600 dark:text-gray-400 hover:underline ml-auto">
                      Set Default
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      </div>
    </div>
  );
}
