import React, { useEffect, useMemo, useState } from "react"; import { motion } from "framer-motion"; import { Card, CardContent } from "@/components/ui/card"; import { Button } from "@/components/ui/button"; import { Input } from "@/components/ui/input"; import { Textarea } from "@/components/ui/textarea"; import { Checkbox } from "@/components/ui/checkbox"; import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; import { Badge } from "@/components/ui/badge"; import { Loader2, Gift, Link2, Plus, Check, EyeOff, Eye, Sparkles, Trash2, Users } from "lucide-react";

// ===================== // ⚙️ FIREBASE (опционально) // ===================== // Чтобы синхронизировать список между всеми членами семьи и скрывать личность "дарителя" от автора, // заполните ниже объект firebaseConfig из консоли Firebase и раскомментируйте блок инициализации. // Если оставить пустым — всё будет работать локально в localStorage (без синхронизации).

// import { initializeApp } from "firebase/app"; // import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"; // import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = { // apiKey: "", // authDomain: "", // projectId: "", };

// let app = null, db = null, auth = null; // if (firebaseConfig.apiKey) { //   app = initializeApp(firebaseConfig); //   db = getFirestore(app); //   auth = getAuth(app); // }

// ===================== // 🔐 Роли и модель данных // ===================== // listId: строка (например, фамилия или название праздника) // item: { id, title, url, price, note, image, addedByUid, createdAt } // claims: в подколлекции /lists/{listId}/claims/{itemId} -> { claimerUid, claimerName, createdAt } // Автор (owner) видит факт брони (есть/нет), но не видит claimerName. // Дарители (santa) видят, занято ли и кем (по желанию можно скрыть имя — чекбокс в UI).

// ===================== // 🧠 Вспомогательные утилиты // ===================== const uid = () => Math.random().toString(36).slice(2, 10);

const saveLocal = (key, val) => localStorage.setItem(key, JSON.stringify(val)); const loadLocal = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

const prettyPrice = (p) => { if (!p) return ""; const num = Number(String(p).replace(/[^0-9.,]/g, "").replace(",", ".")); if (Number.isFinite(num)) return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(num); return p; };

async function fetchLinkPreview(url) { // Без бэкенда большинство сайтов режут CORS. Берём общественный Microlink API как вежливый фолбэк. // Можно заменить/отключить в настройках ниже. try { const res = await fetch(https://api.microlink.io/?url=${encodeURIComponent(url)}&audio=false&video=false); const data = await res.json(); const r = data?.data || {}; return { title: r.title || "", description: r.description || "", image: r.image?.url || r.logo?.url || "", publisher: r.publisher || new URL(url).hostname.replace("www.", ""), }; } catch { return { title: "", description: "", image: "", publisher: "" }; } }

// ===================== // 🎨 Компоненты UI // ===================== function Header({ role, setRole, listId, setListId, displayName, setDisplayName }) { return ( <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 p-4"> <div className="flex items-center gap-3"> <Gift className="w-7 h-7" /> <div> <h1 className="text-2xl font-semibold">Семейный виш‑лист</h1> <p className="text-sm text-muted-foreground">Красивая страница подарков с тайными бронями 🎁</p> </div> </div>

<div className="flex flex-wrap items-center gap-3">
    <Input value={listId} onChange={(e)=>setListId(e.target.value.trim())} placeholder="Название списка (например: Новый год 2025)" className="w-64" />
    <Input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder="Ваше имя" className="w-40" />
    <Select value={role} onValueChange={(v)=>setRole(v)}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Выберите роль" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="owner">Автор списка</SelectItem>
        <SelectItem value="santa">Даритель</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>

); }

function AddItemForm({ onAdd }) { const [title, setTitle] = useState(""); const [url, setUrl] = useState(""); const [price, setPrice] = useState(""); const [note, setNote] = useState(""); const [loading, setLoading] = useState(false); const [preview, setPreview] = useState(null);

useEffect(() => { let active = true; (async () => { if (!url || !/^https?:///i.test(url)) { setPreview(null); return; } setLoading(true); const p = await fetchLinkPreview(url); if (active) { setPreview(p); setLoading(false); } })(); return () => { active = false; }; }, [url]);

const submit = () => { if (!title.trim()) return; onAdd({ title: title.trim(), url: url.trim(), price: price.trim(), note: note.trim(), preview }); setTitle(""); setUrl(""); setPrice(""); setNote(""); setPreview(null); };

return ( <Card className="border-0 shadow-sm"> <CardContent className="p-4 grid md:grid-cols-3 gap-4"> <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3"> <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Что хочу" /> <Input value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="Цена (необязательно)" /> <div className="col-span-1 md:col-span-2 flex gap-2 items-center"> <Link2 className="w-4 h-4" /> <Input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="Ссылка на товар (маркетплейс)" /> </div> <div className="col-span-1 md:col-span-2"> <Textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Комментарий/размер/цвет" rows={3} /> </div> </div> <div className="flex flex-col gap-3"> <Button onClick={submit} className="w-full"><Plus className="w-4 h-4 mr-2" />Добавить</Button> {loading && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> загружаем превью…</div>} {preview && ( <div className="rounded-xl border p-2 flex gap-3 items-start"> {preview.image ? ( <img src={preview.image} alt="preview" className="w-16 h-16 rounded-lg object-cover"/> ) : ( <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center"> <Link2 className="w-5 h-5"/> </div> )} <div className="text-xs"> <div className="font-medium line-clamp-2">{preview.title || "Предпросмотр ссылки"}</div> <div className="text-muted-foreground line-clamp-2">{preview.description}</div> <div className="mt-1"><Badge variant="secondary">{preview.publisher}</Badge></div> </div> </div> )} </div> </CardContent> </Card> ); }

function ItemCard({ item, role, currentUid, onClaim, onUnclaim, claimsCountVisible, onDelete }) { const claimed = item.claims && item.claims.length > 0; const youClaimed = (item.claims || []).some(c => c.claimerUid === currentUid); const firstClaim = (item.claims || [])[0];

return ( <motion.div layout initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}> <Card className="overflow-hidden border-0 shadow group"> <div className="grid grid-cols-[96px_1fr] gap-3 p-3"> {item.preview?.image ? ( <img src={item.preview.image} alt="img" className="w-24 h-24 rounded-xl object-cover"/> ) : ( <div className={w-24 h-24 rounded-xl flex items-center justify-center ${claimed?"bg-green-50":"bg-muted"}}> <Gift className="w-6 h-6"/> </div> )} <div className="flex flex-col"> <div className="flex items-start justify-between gap-2"> <div> <div className="text-base font-semibold leading-tight">{item.title}</div> {item.price && <div className="text-sm text-muted-foreground">{prettyPrice(item.price)}</div>} {item.note && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.note}</div>} </div> {onDelete && ( <Button size="icon" variant="ghost" onClick={()=>onDelete(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></Button> )} </div> <div className="mt-2 flex items-center gap-2 flex-wrap"> {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="text-sm underline inline-flex items-center gap-1"><Link2 className="w-4 h-4"/> Открыть ссылку</a>} {role === "owner" ? ( <Badge variant={claimed?"default":"secondary"}>{claimed? "Кто-то уже забронировал" : "Пока свободно"}</Badge> ) : ( claimed ? ( youClaimed ? ( <div className="flex items-center gap-2"> <Badge variant="default" className="inline-flex items-center gap-1"><Check className="w-3 h-3"/> Вы забронировали</Badge> <Button size="sm" variant="outline" onClick={()=>onUnclaim(item.id)}>Снять бронь</Button> </div> ) : ( <Badge variant="secondary">Уже забронировано</Badge> ) ) : ( <Button size="sm" onClick={()=>onClaim(item.id)}>Забронировать</Button> ) )} {role === "santa" && claimsCountVisible && claimed && firstClaim?.claimerName && ( <span className="text-xs text-muted-foreground">(забронировал(а): {firstClaim.claimerName})</span> )} </div> </div> </div> </Card> </motion.div> ); }

export default function App() { const [listId, setListId] = useState(loadLocal("wish:listId", "Новый год 2025")); const [role, setRole] = useState(loadLocal("wish:role", "owner")); const [displayName, setDisplayName] = useState(loadLocal("wish:name", "")); const [items, setItems] = useState(loadLocal("wish:items", [])); const [claimsCountVisible, setClaimsCountVisible] = useState(false); // дарители могут показать имя бронировавшего const [currentUid, setCurrentUid] = useState(loadLocal("wish:uid", uid()));

// persist locals useEffect(()=>saveLocal("wish:listId", listId), [listId]); useEffect(()=>saveLocal("wish:role", role), [role]); useEffect(()=>saveLocal("wish:name", displayName), [displayName]); useEffect(()=>saveLocal("wish:items", items), [items]); useEffect(()=>saveLocal("wish:uid", currentUid), [currentUid]);

// NOTE: Локальный режим (без Firebase): все данные только у вас на устройстве. // Чтобы включить онлайн‑синхронизацию и тайные брони между всеми участниками: // 1) Создайте проект Firebase, включите Anonymous Auth и Firestore. // 2) Вставьте firebaseConfig и раскомментируйте импорт/инициализацию наверху. // 3) Замените функции addItem/claim/unclaim на Firestore-варианты (см. комментарии ниже).

const addItem = async ({ title, url, price, note, preview }) => { const item = { id: uid(), title, url, price, note, preview, createdAt: Date.now(), addedByUid: currentUid, claims: [] }; setItems((prev)=>[item, ...prev]); // 🔁 Firestore пример: // await setDoc(doc(db, "lists", listId), { updatedAt: Date.now() }, { merge: true }); // await setDoc(doc(db, lists/${listId}/items, item.id), item); };

const deleteItem = async (id) => { setItems(prev => prev.filter(i => i.id !== id)); // Firestore: await deleteDoc(doc(db, lists/${listId}/items, id)); };

const claim = async (itemId) => { setItems(prev => prev.map(i => i.id===itemId ? { ...i, claims: [{ claimerUid: currentUid, claimerName: displayName || "Без имени", createdAt: Date.now() }] } : i)); // Firestore: await setDoc(doc(db, lists/${listId}/claims, itemId), { claimerUid: auth.currentUser.uid, claimerName: displayName, createdAt: Date.now() }); }; const unclaim = async (itemId) => { setItems(prev => prev.map(i => i.id===itemId ? { ...i, claims: [] } : i)); // Firestore: await deleteDoc(doc(db, lists/${listId}/claims, itemId)); };

const sortedItems = useMemo(() => { const claimed = items.filter(i => (i.claims?.length || 0) > 0); const free = items.filter(i => (i.claims?.length || 0) === 0); return [...free, ...claimed]; }, [items]);

return ( <div className="min-h-screen bg-gradient-to-b from-white to-slate-50"> <div className="max-w-5xl mx-auto p-4"> <Header role={role} setRole={setRole} listId={listId} setListId={setListId} displayName={displayName} setDisplayName={setDisplayName} />

<Tabs defaultValue="list" className="mt-2">
      <TabsList>
        <TabsTrigger value="list">Список желаний</TabsTrigger>
        <TabsTrigger value="howto">Поделиться</TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="w-4 h-4"/> Список: <span className="font-medium">{listId}</span></div>
          {role === "santa" && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={claimsCountVisible} onCheckedChange={(v)=>setClaimsCountVisible(Boolean(v))} /> Показывать имя забронировавшего
            </label>
          )}
        </div>

        {role === "owner" && (
          <AddItemForm onAdd={addItem} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedItems.map(item => (
            <ItemCard key={item.id} item={item} role={role} currentUid={currentUid} onClaim={claim} onUnclaim={unclaim} claimsCountVisible={claimsCountVisible} onDelete={role==="owner"?deleteItem:undefined} />
          ))}
        </div>

        {sortedItems.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <Sparkles className="w-6 h-6 mx-auto mb-2"/>
            Пока пусто. Добавьте первое желание!
          </div>
        )}
      </TabsContent>

      <TabsContent value="howto" className="mt-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4 text-sm leading-relaxed">
            <div className="font-medium">Как пользоваться</div>
            <ol className="list-decimal ml-4 space-y-2">
              <li>Придумайте общее название списка (например, «Новый год 2025»), укажите его наверху.</li>
              <li>Автор выбирает роль «Автор списка», добавляет желания и делится этой страницей (URL один и тот же для всех).</li>
              <li>Дарители выбирают роль «Даритель», открывают список и нажимают «Забронировать» на выбранном подарке.</li>
              <li>Автор видит, что подарок забронирован, но не видит кем.</li>
            </ol>
            <div className="font-medium pt-2">Онлайн‑синхронизация (опционально)</div>
            <p>Сейчас данные сохраняются только локально на вашем устройстве. Чтобы синхронизировать список между всеми участниками, подключите Firebase (см. комментарии вверху файла). Там же приведена модель и указания. Без синхронизации можно экспортировать/импортировать JSON (быстро доделать при необходимости).</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</div>

); }

