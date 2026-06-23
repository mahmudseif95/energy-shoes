"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

const FAMOUS_BRANDS = [
  'Nike', 'Adidas', 'Puma', 'New Balance', 'Asics', 'Skechers', 
  'Vans', 'Converse', 'Clarks', 'Ecco', 'Geox', 'Timberland', 
  'Zara', 'Massimo Dutti', 'Aldo', 'Steve Madden'
];

const SHOE_TYPES = ['سنيكرز يومي', 'رسمي جلد', 'لوفرز وسيادون', 'بوت شتوي', 'صندل صيفي', 'كعب عالي', 'فلات نسائي'];

interface ShoeFormData {
  brand: string;
  model_name: string;
  art_number: string;
  target_group: 'رجالي' | 'نسائي' | 'ولادي';
  shoe_type: string;
  size_eu: string;
  condition_grade: 'أخو الجديد' | 'ممتاز' | 'نظيف جداً';
  cost_price: string;
  selling_price: string;
}

export default function ControlRoom() {
  const [formData, setFormData] = useState<ShoeFormData>({
    brand: 'Nike',
    model_name: '',
    art_number: '',
    target_group: 'رجالي',
    shoe_type: 'سنيكرز يومي',
    size_eu: '42',
    condition_grade: 'أخو الجديد',
    cost_price: '',
    selling_price: ''
  });

  // ستيت خاصة بالصورة
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  // معالجة اختيار الصورة ورؤيتها لايف قبل الرفع
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // عمل رابط مؤقت للمعاينة
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let uploadedImageUrl = '';

      // 1. إذا المستخدم منقي صورة، نرفعها أولاً للـ Storage Bucket
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: storageData, error: storageError } = await supabase.storage
          .from('shoe-images')
          .upload(fileName, imageFile);

        if (storageError) throw storageError;

        // سحب الرابط المباشر للعلامة المرفوعة
        const { data: publicUrlData } = supabase.storage
          .from('shoe-images')
          .getPublicUrl(fileName);

        uploadedImageUrl = publicUrlData.publicUrl;
      }

      // 2. إدخال كل البيانات مع رابط الصورة المرفوعة إلى جدول الداتابيز
      const { error } = await supabase
        .from('shoes_inventory')
        .insert([
          {
            brand: formData.brand,
            model_name: formData.model_name || null,
            art_number: formData.art_number || null,
            target_group: formData.target_group,
            shoe_type: formData.shoe_type,
            size_eu: parseFloat(formData.size_eu),
            condition_grade: formData.condition_grade,
            cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
            selling_price: parseFloat(formData.selling_price),
            images_urls: uploadedImageUrl ? [uploadedImageUrl] : null // حفظ الرابط بصفوف الداتابيز
          }
        ]);

      if (error) throw error;

      setMessage({ type: 'success', text: '🎉 يا عيني ع الفخامة! الحذاء وصورته طاروا عالمخزن بنجاح لايف.' });
      
      // تصفير الفورم والصور بعد النجاح
      setFormData(prev => ({
        ...prev,
        model_name: '',
        art_number: '',
        size_eu: '42',
        cost_price: '',
        selling_price: ''
      }));
      setImageFile(null);
      setImagePreview('');

    } catch (error: any) {
      if (error.code === '23505') {
        setMessage({ type: 'error', text: '❌ الكود الأوروبي هيدا مسجل من قبل، شيك ع الفردة ثانية!' });
      } else {
        setMessage({ type: 'error', text: `❌ في شي غلط: ${error.message}` });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans" dir="rtl">
      
      {/* هيدر توب بريميوم */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 text-slate-950 font-black p-2.5 rounded-xl shadow-md transform -rotate-3 text-lg">
              ⚡️ ENERGY
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">SHOES</h1>
              <p className="text-xs text-slate-500 font-medium">غرفة التحكم بالمخزون والألبوم</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            السيرفر متصل والمخزن جاهز
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* لوحة الإدخال (7 أعمدة) */}
          <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl border border-slate-150 p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">إضافة قطعة جديدة للمخزن</h2>
              <p className="text-sm text-slate-500">ارفع صورة الحذاء وعبّي بياناته ليظهر فوراً أونلاين.</p>
            </div>

            {message.text && (
              <div className={`p-4 rounded-2xl mb-6 text-sm font-semibold flex items-center gap-2 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* خانة رفع الصورة الجديدة 📸 */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-all text-center">
                <label className="cursor-pointer block space-y-2">
                  <span className="text-3xl block">📸</span>
                  <span className="text-xs font-bold text-slate-700 block">اضغط هنا لاختيار صورة الحذاء الأوروبي</span>
                  <span className="text-[10px] text-slate-400 block">صيغ الصور المدعومة: PNG, JPG, WEBP</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                </label>
                {imageFile && (
                  <p className="text-xs text-emerald-600 font-bold mt-2">✅ تم اختيار: {imageFile.name}</p>
                )}
              </div>

              {/* الماركة والنوع */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">الماركة العالمية *</label>
                  <input 
                    type="text" 
                    list="brands-list"
                    required
                    placeholder="مثال: Nike, Clarks..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all font-medium"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  />
                  <datalist id="brands-list">
                    {FAMOUS_BRANDS.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">نوع الحذاء</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all font-medium"
                    value={formData.shoe_type}
                    onChange={(e) => setFormData({...formData, shoe_type: e.target.value})}
                  >
                    {SHOE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* الموديل والكود */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">اسم الموديل (اختياري)</label>
                  <input 
                    type="text" 
                    placeholder="مثال: Air Max 90"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all font-medium"
                    value={formData.model_name}
                    onChange={(e) => setFormData({...formData, model_name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">الكود الأوروبي (Art Number)</label>
                  <input 
                    type="text" 
                    placeholder="تلقاه ع التيكيت الداخلي"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all"
                    value={formData.art_number}
                    onChange={(e) => setFormData({...formData, art_number: e.target.value})}
                  />
                </div>
              </div>

              {/* الفئة */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">الجنس / الفئة</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['رجالي', 'نسائي', 'ولادي'] as const).map((group) => (
                    <button
                      key={group}
                      type="button"
                      className={`p-3.5 rounded-2xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${formData.target_group === group ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      onClick={() => setFormData({...formData, target_group: group})}
                    >
                      {group === 'رجالي' ? '👨 رجالي' : group === 'نسائي' ? '👩 نسائي' : '🧒 ولادي'}
                    </button>
                  ))}
                </div>
              </div>

              {/* المقاس والنظافة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">المقاس الأوروبي (EU) *</label>
                  <input 
                    type="number" 
                    step="0.5"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all font-medium"
                    value={formData.size_eu}
                    onChange={(e) => setFormData({...formData, size_eu: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">حالة ونظافة الفردة</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['أخو الجديد', 'ممتاز', 'نظيف جداً'] as const).map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        className={`text-xs p-3.5 rounded-2xl font-black border transition-all ${formData.condition_grade === grade ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                        onClick={() => setFormData({...formData, condition_grade: grade})}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* الأسعار */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">سعر التكلفة ماليًا ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="مخفي عن الزبون"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all font-medium"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">سعر البيع المعروض للزبون ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full bg-amber-50/50 border border-amber-200 rounded-2xl p-3.5 text-slate-950 font-black text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full p-4 rounded-2xl font-black text-slate-950 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 transition-all text-md shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {loading ? '🚀 جاري رفع الصورة وتأمين القطعة...' : '💾 إدخال فوري للمخزن وحفظ'}
              </button>

            </form>
          </div>

          {/* المعاينة المباشرة (5 أعمدة) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 tracking-wider">Live Store Preview</span>
              <span className="text-[10px] bg-yellow-400/20 text-yellow-400 font-bold px-2 py-0.5 rounded-full">كرت الزبون لايف</span>
            </div>

            {/* كرت الحذاء الفخم */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-150 transition-all duration-300 hover:shadow-2xl">
              <div className="relative bg-slate-100 aspect-[4/3] flex items-center justify-center border-b border-slate-100 overflow-hidden">
                
                {/* هنا السحر: إذا منقي صورة حتبين فوراً، وإذا لأ بيبين بليس هولدر */}
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center space-y-2">
                    <span className="text-4xl block text-slate-400">👟</span>
                    <p className="text-xs font-bold text-slate-400">لم تختر صورة بعد</p>
                  </div>
                )}
                
                <span className="absolute top-4 right-4 bg-orange-600 text-white font-black text-[10px] px-3 py-1 rounded-full shadow-md">
                  {formData.condition_grade}
                </span>

                <span className="absolute top-4 left-4 bg-slate-900/10 text-slate-800 font-bold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {formData.target_group}
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{formData.brand || 'الماركة'}</span>
                    <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      مقاس: <span className="font-mono font-bold">{formData.size_eu || '--'}</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    {formData.model_name || 'اسم الموديل حيكون هون'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">{formData.shoe_type}</p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400">السعر المعروض</p>
                    <p className="text-2xl font-black text-slate-950 font-mono mt-0.5">
                      ${formData.selling_price || '0'}
                    </p>
                  </div>
                  <button type="button" className="bg-slate-900 text-white font-black text-xs px-5 py-3 rounded-xl shadow-md">
                    شراء سريع 🛍️
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}