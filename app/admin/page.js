'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, XCircle, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      router.push('/');
    } else {
      fetchItems();
    }
  }, [status, session, router]);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !currentStatus }),
      });

      if (!res.ok) throw new Error('Failed to update item');

      toast.success(`Item ${!currentStatus ? 'verified' : 'unverified'} successfully`);
      fetchItems();
    } catch (error) {
      console.error('Verify error:', error);
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete item');

      toast.success('Item deleted successfully');
      fetchItems();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 px-6 py-12">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Manage all lost and found items</p>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500 text-lg px-4 py-2">
              {items.length} Total Items
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{items.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Lost Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-400">
                {items.filter(i => i.status === 'Lost').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Found Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-400">
                {items.filter(i => i.status === 'Found').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-cyan-400">
                {items.filter(i => i.verified).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Items Table */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl text-white">All Items</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No items found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-gray-300">Title</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Category</TableHead>
                      <TableHead className="text-gray-300">Location</TableHead>
                      <TableHead className="text-gray-300">Posted By</TableHead>
                      <TableHead className="text-gray-300">Verified</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white font-medium">
                          <Link href={`/item/${item.id}`} className="hover:text-cyan-400">
                            {item.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${
                              item.status === 'Lost'
                                ? 'border-red-500 text-red-400'
                                : 'border-emerald-500 text-emerald-400'
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{item.category}</TableCell>
                        <TableCell className="text-gray-300">{item.location}</TableCell>
                        <TableCell className="text-gray-300">{item.userName}</TableCell>
                        <TableCell>
                          {item.verified ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-600" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerify(item.id, item.verified)}
                              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
                            >
                              {item.verified ? 'Unverify' : 'Verify'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
