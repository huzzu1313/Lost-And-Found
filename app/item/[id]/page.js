'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Calendar, Mail, User, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function ItemDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  const fetchItem = async () => {
    try {
      const res = await fetch(`/api/items/${params.id}`);
      if (!res.ok) throw new Error('Item not found');
      const data = await res.json();
      setItem(data.item);
    } catch (error) {
      console.error('Failed to fetch item:', error);
      toast.error('Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/items/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete item');

      toast.success('Item deleted successfully');
      router.push('/');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Item Not Found</h2>
          <Link href="/" className="text-cyan-400 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = session?.user && (session.user.id === item.userId || session.user.role === 'admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 px-6 py-12">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div>
            {item.image ? (
              <div className="relative w-full h-96 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-96 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Package className="w-24 h-24 text-gray-600" />
              </div>
            )}
          </div>

          {/* Details Section */}
          <div>
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <CardTitle className="text-3xl text-white">{item.title}</CardTitle>
                  <Badge
                    variant="outline"
                    className={`${
                      item.status === 'Lost'
                        ? 'border-red-500 text-red-400 bg-red-500/10'
                        : 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    } text-lg px-4 py-1`}
                  >
                    {item.status}
                  </Badge>
                </div>
                {item.verified && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500 w-fit">
                    Verified by Admin
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300 leading-relaxed">{item.description}</p>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center text-gray-300">
                    <Package className="w-5 h-5 mr-3 text-cyan-400" />
                    <span className="font-medium mr-2">Category:</span>
                    <span>{item.category}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <MapPin className="w-5 h-5 mr-3 text-cyan-400" />
                    <span className="font-medium mr-2">Location:</span>
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Calendar className="w-5 h-5 mr-3 text-cyan-400" />
                    <span className="font-medium mr-2">Date:</span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <User className="w-5 h-5 mr-3 text-cyan-400" />
                    <span className="font-medium mr-2">Posted by:</span>
                    <span>{item.userName}</span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">Contact Information</h3>
                  <div className="flex items-center text-gray-300">
                    <Mail className="w-5 h-5 mr-3 text-cyan-400" />
                    <a href={`mailto:${item.contactInfo}`} className="text-cyan-400 hover:underline">
                      {item.contactInfo}
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                {canEdit && (
                  <div className="pt-4 border-t border-white/10 flex gap-3">
                    <Button
                      onClick={handleDelete}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}

                {/* Posted Date */}
                <div className="text-sm text-gray-500 pt-4 border-t border-white/10">
                  Posted on {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
