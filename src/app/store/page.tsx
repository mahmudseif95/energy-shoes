"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ShoeItem {
  id: number;
  brand: string;
  model_name: string;
  target_group: 'رجالي' | 'نسائي' | 'ولادي';
  shoe_type: string;
  size_eu: number;
  condition_grade: string;
  selling_price: number;
  images_urls: string[];
}

export default function Storefront() {
  const [shoes, setShoes] = useState<ShoeItem[]>([]);
  const [filteredShoes, setFilteredShoes] = useState<ShoeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ستيت الفلاتر
  const [selectedTarget, setSelectedTarget] = useState<string>('الكل');
  const [selectedSize, setSelectedSize] = useState<string>('الكل');

  // ستيت مودال الشراء (Checkout)
  const [selectedShoe, setSelectedShoe] = useState<ShoeItem | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  // ١. جلب الأحذية المتوفرة فقط (التي لم تباع)
  useEffect(() => {
    async function fetchInventory() {
      const { data, error } = await supabase
        .from('shoes_inventory')
        .select('*')
        .eq('is_sold', false)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setShoes(data as ShoeItem[]);
        setFilteredShoes(data as ShoeItem[]);
      }
      setLoading(false);
    }
    fetchInventory();
  }, []);

  // ٢. تفعيل الفلترة الحية عند تغيير الخيارات
  useEffect(() => {
    let result = shoes;
    if (selectedTarget !== 'الكل') {
      result = result.filter(s => s.target_group === selectedTarget);
    }
    if (selectedSize !== 'الكل') {
      result = result.filter(s => s.size_eu.toString() === selectedSize);
    }
    setFilteredShoes(result);
  }, [selectedTarget, selectedSize, shoes]);

  // ٣. معالجة إرسال الطلب (Checkout Submit)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShoe) return;
    setOrderLoading(true);

    try {
      // إدخال الطلب في جدول الطلبيات
      const { error: orderError } = await supabase
        .from('shoe_orders')
        .insert([
          {
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_address: customerAddress,
            shoe_id: selectedShoe.id,
            shoe_details: `${selectedShoe.brand} ${selectedShoe.model_name} - مقاس ${selectedShoe.size_eu}`,
            total_price: selectedShoe.selling_price
          }
        ]);

      if (orderError) throw orderError;

      // تحديث حالة الحذاء ليصبح "مباع" وتلقائياً يختفي من السايت
      await supabase
        .from('shoes_inventory')
        .update({ is_sold: true })
        .eq('id', selectedShoe.id);

      setOrderSuccess(true);
      // إزالة القطعة المباعة من القائمة أمام الزبون فوراً
      setShoes(shoes.filter(s => s.id !== selectedShoe.id));

    } catch (err: any) {
      alert("حدث خطأ أثناء إرسال الطلب: " + err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12" dir="rtl">
      
      {/* هيدر المتجر الفخم */}
      <header className="bg-slate-900 text-white shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 text-slate-950 font-black p-2 rounded-xl text-lg transform -rotate-2">
              ⚡️ ENERGY
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">SHOES STORE</h1>
              <p className="text-[10px] text-slate-400 font-bold">أحذية أوروبية أوريجينال | كأنها جديدة</p>
            </div>
          </div>

          {/* أزرار الفلترة السريعة حسب الفئة */}
          <div className="flex gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            {['الكل', 'رجالي', 'نسائي', 'ولادي'].map((t) => (
              <button
                key={t}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedTarget === t ? 'bg-yellow-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'}`}
                onClick={() => setSelectedTarget(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* فلتر المقاسات الذكي */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-400">المقاس:</label>
            <select
              className="bg-slate-800 border border-slate-700 text-white rounded-xl p-2 text-xs font-bold focus:outline-none focus:border-yellow-400"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              <option value="الكل">الكل</option>
              {Array.from(new Set(shoes.map(s => s.size_eu))).sort().map(size => (
                <option key={size} value={size.toString()}>{size}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* عرض المنتجات */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-slate-500 font-bold animate-pulse">⚙️ جاري فتح واجهة العرض للمخزن لايف...</div>
        ) : filteredShoes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-5xl block mb-2">👟</span>
            <h3 className="text-md font-bold text-slate-700">لا يوجد قطع متوفرة حالياً تطابق خياراتك</h3>
            <p className="text-xs text-slate-400 mt-1">المخزن يتحدث باستمرار، تابعنا!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredShoes.map((shoe) => (
              <div key={shoe.id} className="bg-white rounded-3xl overflow-hidden shadow-md border border-slate-150 flex flex-col justify-between hover:shadow-xl transition-all group">
                <div className="relative bg-slate-100 aspect-[4/3] flex items-center justify-center overflow-hidden">
                  {shoe.images_urls && shoe.images_urls[0] ? (
                    <img src={shoe.images_urls[0]} alt={shoe.brand} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                  ) : (
                    <span className="text-4xl">👟</span>
                  )}
                  <span className="absolute top-3 right-3 bg-orange-600 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full shadow-sm">
                    {shoe.condition_grade}
                  </span>
                  <span className="absolute top-3 left-3 bg-slate-900/10 text-slate-800 font-black text-[9px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {shoe.target_group}
                  </span>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span className="uppercase tracking-wider">{shoe.brand}</span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        مقاس {shoe.size_eu}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mt-1 line-clamp-1">
                      {shoe.model_name || shoe.shoe_type}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400">السعر الفرصة</p>
                      <p className="text-lg font-black text-slate-950 font-mono">${shoe.selling_price}</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedShoe(shoe); setOrderSuccess(false); }}
                      className="bg-slate-900 hover:bg-yellow-400 hover:text-slate-950 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow transition-all"
                    >
                      طلب سريع 🛍️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* مودال الطلب الفوري السريع (Checkout Modal) */}
      {selectedShoe && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            
            <button 
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 font-black text-sm"
              onClick={() => setSelectedShoe(null)}
            >
              ✕ اغلاق
            </button>

            {!orderSuccess ? (
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div className="text-center pb-2 border-b border-slate-100">
                  <h3 className="text-md font-black text-slate-900">تأكيد طلب الشراء الفوري</h3>
                  <p className="text-xs text-slate-500 mt-1">أنت عم تطلب: <span className="font-bold text-slate-900">{selectedShoe.brand} ({selectedShoe.size_eu})</span> بمبلغ <span className="font-bold text-emerald-600">${selectedShoe.selling_price}</span></p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسمك الكريم *</label>
                  <input type="text" required placeholder="الاسم الكامل" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الموبايل (واتساب) *</label>
                  <input type="tel" required placeholder="مثال: 76123456" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-left font-mono" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان التوصيل بالكامل *</label>
                  <textarea required rows={2} placeholder="المدينة، الشارع، تفاصيل مبنى" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                </div>

                <button
                  type="submit"
                  disabled={orderLoading}
                  className="w-full p-3.5 bg-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-md hover:bg-yellow-300 transition-all text-center"
                >
                  {orderLoading ? 'جاري تسجيل طلبك...' : '🚀 تأكيد الطلب والتوصيل دليفري'}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-3">
                <span className="text-5xl block animate-bounce">🎉</span>
                <h3 className="text-md font-black text-emerald-600">تم تسجيل طلبك بنجاح!</h3>
                <p className="text-xs text-slate-600 leading-relaxed">ألف مبروك! القطعة انحجزت إلك، وتواصلنا حيكون معك على الواتساب لتأكيد موعد التوصيل الدليفري فوراً.</p>
                <button 
                  type="button"
                  onClick={() => setSelectedShoe(null)}
                  className="mt-4 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  العودة لتصفح المتجر
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}