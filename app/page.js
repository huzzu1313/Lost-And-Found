'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Filter, MapPin, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    location: 'all'
  });

  useEffect(() => {
    fetchItems();
  }, [filters, searchQuery]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.location !== 'all') params.append('location', filters.location);

      const res = await fetch(`/api/items?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchItems();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Package className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">Lost & Found</span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-gray-300 hover:text-white transition">
              Home
            </Link>
            {session && (
              <Link href="/report" className="text-gray-300 hover:text-white transition">
                Report
              </Link>
            )}
            {session?.user?.role === 'admin' && (
              <Link href="/admin" className="text-gray-300 hover:text-white transition">
                Admin
              </Link>
            )}
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-300">{session.user.name}</span>
                <Button
                  onClick={() => router.push('/api/auth/signout')}
                  variant="outline"
                  size="sm"
                  className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => router.push('/login')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white"
                >
                  Login
                </Button>
                <Button
                  onClick={() => router.push('/register')}
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Find What's Lost.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              Return What's Found.
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            A community-driven space to help reunite people with their belongings.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for lost items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-6 bg-white/5 backdrop-blur-md border-white/10 text-white placeholder:text-gray-500 rounded-2xl focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>
          </form>

          {/* Action Buttons */}
          {session ? (
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={() => router.push('/report?type=lost')}
                size="lg"
                className="bg-transparent border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white px-8 py-6 text-lg rounded-xl transition-all"
              >
                Report Lost Item
              </Button>
              <Button
                onClick={() => router.push('/report?type=found')}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white px-8 py-6 text-lg rounded-xl transition-all"
              >
                Report Found Item
              </Button>
            </div>
          ) : (
            <p className="text-gray-400">
              <Link href="/login" className="text-cyan-400 hover:underline">
                Login
              </Link>{' '}
              to report items
            </p>
          )}
        </div>
      </section>

      {/* Filters and Listings Section - MOVED UP */}
      <section className="px-6 pb-20">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Recent Listings</h2>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-8 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status</label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                      <SelectItem value="Found">Found</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Category</label>
                  <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Documents">Documents</SelectItem>
                      <SelectItem value="Accessories">Accessories</SelectItem>
                      <SelectItem value="Clothing">Clothing</SelectItem>
                      <SelectItem value="Keys">Keys</SelectItem>
                      <SelectItem value="Pets">Pets</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Location</label>
                  <Input
                    type="text"
                    placeholder="Enter location"
                    value={filters.location === 'all' ? '' : filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value || 'all' })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Items Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
              <p className="text-gray-400 mt-4">Loading items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className="bg-white/5 backdrop-blur-md border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 cursor-pointer"
                  onClick={() => router.push(`/item/${item.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-white text-xl">{item.title}</CardTitle>
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
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.image && (
                      <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-white/5">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-400">
                        <MapPin className="w-4 h-4 mr-2 text-cyan-400" />
                        {item.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Package className="w-4 h-4 mr-2 text-cyan-400" />
                        {item.category}
                      </div>
                    </div>
                  </CardContent>
                  {item.verified && (
                    <CardFooter>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500">
                        Verified
                      </Badge>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Location Information Section - MOVED BELOW Recent Listings */}
      <section className="px-6 pb-16">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">📍 Item Collection Points</h2>
            <p className="text-lg text-gray-400">Where to drop off found items or collect your lost belongings</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Item Drop-off Location */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white">Item Drop-off Location</h3>
                  <p className="text-gray-400">Found something? Drop it here</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span className="text-lg">Engineering College Gate</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span className="text-lg">Ground Floor, Workshop Lab</span>
                </div>
              </div>
            </div>

            {/* Item Pick-up Location */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white">Item Pick-up Location</h3>
                  <p className="text-gray-400">Collect your lost items here</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span className="text-lg">Engineering College Gate</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span className="text-lg">Ground Floor, Workshop Lab</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* College Address Section - MOVED BELOW Collection Points */}
      <section className="px-6 pb-16">
        <div className="container mx-auto">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">🏫 College Address</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Address */}
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-semibold text-white mb-4 flex items-center justify-center md:justify-start">
                  <MapPin className="w-6 h-6 text-cyan-400 mr-3" />
                  Address
                </h3>
                <div className="space-y-2 text-gray-300 text-lg">
                  <p>New Rizvi Educational Complex</p>
                  <p>Off Carter Road, Bandra West</p>
                  <p>Mumbai - 400050</p>
                </div>
              </div>
              
              {/* Contact */}
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-semibold text-white mb-4 flex items-center justify-center md:justify-start">
                  <svg className="w-6 h-6 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone
                </h3>
                <div className="space-y-1 text-gray-300 text-lg">
                  <p>022 - 69778690 / 91 / 92</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">
              <p className="text-lg">© 2025 All rights reserved to <span className="text-cyan-400 font-semibold">Binary Bros</span></p>
            </div>
            <div className="text-gray-400">
              <p className="text-lg">Lost & Found Management System</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
