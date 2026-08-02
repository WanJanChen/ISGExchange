import {
  AtSign,
  Camera,
  Check,
  Gift,
  Instagram,
  MapPin,
  Pencil,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { compressImage } from "../lib/storage";
import type { Exchange, ExchangeDraft, SocialPlatform } from "../types";

const platformBase = (platform: SocialPlatform) =>
  platform === "instagram"
    ? "https://www.instagram.com/"
    : "https://www.threads.com/@";
const newDraft = (): ExchangeDraft => ({
  contact: platformBase("threads"),
  platform: "threads",
  nickname: "",
  receiver: "",
  senderExpenseIds: [],
  note: "",
});
function socialUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
function PlatformIcon({
  platform,
  size = 20,
}: {
  platform: SocialPlatform;
  size?: number;
}) {
  return platform === "instagram" ? (
    <Instagram size={size} aria-hidden="true" />
  ) : (
    <AtSign size={size} aria-hidden="true" />
  );
}
function toDraft(exchange: Exchange): ExchangeDraft {
  return {
    contact: exchange.contactHandle,
    platform: exchange.contactPlatform ?? "instagram",
    nickname: exchange.nickname ?? "",
    receiver: exchange.receiverItemText,
    senderExpenseIds: exchange.senderExpenseIds ?? (exchange.senderExpenseId ? [exchange.senderExpenseId] : []),
    note: exchange.note ?? "",
    image: exchange.receiverItemImage,
  };
}

interface Props {
  exchanges: Exchange[];
  giftOptions: { id: string; name: string }[];
  onAdd: (draft: ExchangeDraft) => void | Promise<void>;
  onUpdate: (id: string, draft: ExchangeDraft) => void | Promise<void>;
  onToggle: (id: string, field: "isPrepared" | "isCompleted") => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function ExchangeList({
  exchanges,
  giftOptions,
  onAdd,
  onUpdate,
  onToggle,
  onDelete,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [draft, setDraft] = useState<ExchangeDraft>(newDraft);
  const [selected, setSelected] = useState<Exchange>();
  const [loadingImage, setLoadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ExchangeDraft>(
    key: K,
    value: ExchangeDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  const selectPlatform = (platform: SocialPlatform) =>
    setDraft((current) => ({
      ...current,
      platform,
      contact: platformBase(platform),
    }));
  const closeEditor = () => {
    setIsEditing(false);
    setEditingId(undefined);
    setDraft(newDraft());
  };
  const openEditor = (exchange?: Exchange) => {
    setEditingId(exchange?.id);
    setDraft(exchange ? toDraft(exchange) : newDraft());
    setIsEditing(true);
    setSelected(undefined);
  };
  const selectImage = async (file?: File) => {
    if (!file) return;
    setLoadingImage(true);
    try {
      set("image", await compressImage(file));
    } finally {
      setLoadingImage(false);
    }
  };
  const platforms: SocialPlatform[] = ["threads", "instagram"];
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !draft.contact.trim() ||
      draft.contact === platformBase(draft.platform) ||
      draft.senderExpenseIds.length === 0
    )
      return;
    if (editingId) await onUpdate(editingId, draft);
    else await onAdd(draft);
    closeEditor();
  };

  const editor = (className = "") => (
    <form
      onSubmit={save}
      className={`card space-y-3 ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800">
          {editingId ? "編輯交換夥伴" : "新增交換夥伴"}
        </h3>
        <button type="button" onClick={closeEditor} className="min-h-11 px-3 text-sm text-slate-500">
          取消
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {platforms.map((platform) => (
          <button
            key={platform}
            type="button"
            onClick={() => selectPlatform(platform)}
            className={`min-h-11 rounded-xl text-sm font-bold ${draft.platform === platform ? "bg-serenity-600 text-white" : "bg-serenity-50 text-serenity-700"}`}
          >
            <span className="inline-flex items-center gap-2">
              <PlatformIcon platform={platform} />
              {platform === "instagram" ? "Instagram" : "Threads"}
            </span>
          </button>
        ))}
      </div>
      <input required value={draft.contact} onChange={(event) => set("contact", event.target.value)} placeholder="社群帳號連結" className="field" />
      <input value={draft.nickname} onChange={(event) => set("nickname", event.target.value)} placeholder="暱稱（選填）" className="field" />
      <textarea value={draft.receiver} onChange={(event) => set("receiver", event.target.value)} placeholder="對方提供的交換物" className="field min-h-20" />
      <fieldset className="space-y-2 rounded-2xl border border-serenity-100 p-3">
        <legend className="px-1 text-sm font-bold text-slate-700">選擇我方交換物（可複選）</legend>
        {giftOptions.map((item) => {
          const checked = draft.senderExpenseIds.includes(item.id);
          return (
            <label key={item.id} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-semibold ${checked ? "bg-serenity-100 text-serenity-800" : "bg-slate-50 text-slate-600"}`}>
              <input type="checkbox" checked={checked} onChange={() => set("senderExpenseIds", checked ? draft.senderExpenseIds.filter((id) => id !== item.id) : [...draft.senderExpenseIds, item.id])} className="h-5 w-5 accent-serenity-600" />
              {item.name}
            </label>
          );
        })}
      </fieldset>
      {giftOptions.length === 0 && <p className="text-xs font-semibold text-rosequartz-700">請先新增可交換的應援物品。</p>}
      <input value={draft.note} onChange={(event) => set("note", event.target.value)} placeholder="備註或碰面地點（選填）" className="field" />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => selectImage(event.target.files?.[0])} />
      <button type="button" onClick={() => fileRef.current?.click()} className="secondary-button w-full">
        <Camera size={18} />
        {loadingImage ? "正在處理圖片…" : draft.image ? "更換對方交換物照片" : "加入對方交換物照片"}
      </button>
      {draft.image && <img src={draft.image} alt="對方交換物預覽" className="h-36 w-full rounded-2xl object-cover" />}
      <button className="primary-button w-full" disabled={giftOptions.length === 0}>
        {editingId ? "儲存修改" : "新增交換夥伴"}
      </button>
    </form>
  );

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-kicker">EXCHANGE LIST</p>
          <h2 className="section-title">當日交換清單</h2>
        </div>
        <p className="text-sm font-bold text-slate-400">
          {exchanges.length} 位
        </p>
      </div>
      {isEditing && !editingId ? (
        editor()
      ) : (
        <button type="button" onClick={() => openEditor()} className="secondary-button w-full">
          <Users size={18} />
          新增交換夥伴
        </button>
      )}
      {exchanges.length === 0 && (
        <div className="rounded-3xl border border-dashed border-serenity-200 bg-white p-8 text-center text-sm leading-7 text-slate-500">
          還沒有預約交換的夥伴。
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {exchanges.map((exchange) => editingId === exchange.id ? (
          <div key={exchange.id} className="col-span-2">
            {editor()}
          </div>
        ) : (
          <article
            key={exchange.id}
            onClick={() => setSelected(exchange)}
            className="exchange-card card cursor-pointer p-3 transition hover:-translate-y-0.5"
          >
            <div className="flex flex-col gap-3">
              {exchange.receiverItemImage ? (
                <img
                  src={exchange.receiverItemImage}
                  alt="對方應援物"
                  className="h-[200px] w-[200px] max-w-[45%] shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-[200px] w-[200px] max-w-[45%] shrink-0 items-center justify-center rounded-2xl bg-serenity-50 text-serenity-400">
                  <Gift size={32} />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className="min-w-0 flex-1 truncate font-bold text-slate-800">
                    {exchange.nickname || exchange.contactHandle}
                  </p>
                  <div className="flex shrink-0">
                    <a
                      href={socialUrl(exchange.contactHandle) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="icon-button text-slate-500"
                      aria-label="開啟社群帳號"
                    >
                      <PlatformIcon
                        platform={exchange.contactPlatform ?? "instagram"}
                      />
                    </a>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditor(exchange);
                      }}
                      className="icon-button text-serenity-600"
                      aria-label="編輯交換資料"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(exchange.id);
                      }}
                      className="icon-button text-slate-400"
                      aria-label="刪除交換資料"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  <span className="font-bold text-slate-600">對方：</span>
                  {exchange.receiverItemText || "尚未填寫"}
                </p>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-rosequartz-700">
                  <span>我的：</span>
                  {exchange.senderItemText}
                </p>
                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(exchange.id, "isPrepared");
                    }}
                    className={`status-button w-full ${exchange.isPrepared ? "status-ready" : ""}`}
                  >
                    <Check size={15} />
                    {exchange.isPrepared ? "已準備" : "未準備"}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(exchange.id, "isCompleted");
                    }}
                    className={`status-button w-full ${exchange.isCompleted ? "status-done" : ""}`}
                  >
                    <Check size={15} />
                    {exchange.isCompleted ? "已交換" : "未交換"}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-900/50 p-3 sm:items-center sm:justify-center"
          onClick={() => setSelected(undefined)}
        >
          <article
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">交換夥伴詳情</p>
              <button
                type="button"
                onClick={() => setSelected(undefined)}
                className="icon-button text-slate-500"
                aria-label="關閉"
              >
                <X />
              </button>
            </div>
            {selected.receiverItemImage ? (
              <img
                src={selected.receiverItemImage}
                alt="對方應援物大圖"
                className="h-[48vh] min-h-72 w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-72 items-center justify-center rounded-2xl bg-serenity-50 text-serenity-500">
                <Gift size={52} />
              </div>
            )}
            <div className="mt-4">
              <p className="font-bold text-slate-800">
                {selected.nickname || selected.contactHandle}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                對方應援物：{selected.receiverItemText || "尚未填寫"}
              </p>
              <p className="mt-2 text-sm font-semibold text-rosequartz-700">
                我的應援物：{selected.senderItemText}
              </p>
              {selected.note && (
                <p className="mt-2 flex gap-1 text-sm text-slate-500">
                  <MapPin size={16} />
                  {selected.note}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => openEditor(selected)}
              className="primary-button mt-5 w-full"
            >
              <Pencil size={18} />
              編輯此交換資料
            </button>
          </article>
        </div>
      )}
    </section>
  );
}
