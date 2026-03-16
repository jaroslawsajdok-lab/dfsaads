import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, timeAgo } from "@/lib/home-helpers";
import type { FbPost, FbApiResponse } from "@/lib/home-helpers";
import { ChevronLeft, ChevronRight, Facebook, MessageCircle, Share2, ThumbsUp, X } from "lucide-react";

const CARD_MSG_LEN = 120;

function FbPostModal({ post, open, onClose }: { post: FbPost; open: boolean; onClose: () => void }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
      data-testid={`fb-modal-backdrop-${post.id}`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Post z Facebooka"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid={`fb-modal-${post.id}`}
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 dark:bg-card/80 p-1.5 text-foreground/60 backdrop-blur transition hover:bg-white dark:hover:bg-card hover:text-foreground"
          data-testid={`fb-modal-close-${post.id}`}
        >
          <X className="h-4 w-4" />
        </button>

        {post.images.length > 0 && (
          <div className="space-y-1">
            {post.images.map((img, i) => (
              <img key={i} src={img} alt="" className="w-full object-cover" loading="lazy" />
            ))}
          </div>
        )}

        <div className="p-6">
          <div className="mb-3 text-sm text-muted-foreground">{timeAgo(post.created_time)}</div>

          {post.message && (
            <p className="whitespace-pre-line text-base leading-relaxed text-foreground/90" data-testid={`fb-modal-message-${post.id}`}>
              {post.message}
            </p>
          )}

          <div className="mt-5 flex items-center gap-4 border-t pt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4 text-[#1877F2]" />
              {post.reactions_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {post.comments_count}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              {post.shares_count}
            </span>
            <a
              href={post.permalink_url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto flex items-center gap-1.5 text-sm text-[#1877F2] transition hover:underline"
              data-testid={`fb-modal-link-${post.id}`}
            >
              <Facebook className="h-4 w-4" />
              Zobacz na Facebooku
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function FbPostCard({ post, onSelect }: { post: FbPost; onSelect: () => void }) {
  const needsTruncate = post.message.length > CARD_MSG_LEN;
  const displayMsg = needsTruncate
    ? post.message.slice(0, CARD_MSG_LEN) + "…"
    : post.message;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card text-left transition-shadow hover:shadow-lg"
      data-testid={`fb-post-${post.id}`}
    >
      {post.images.length > 0 && (
        <div className="aspect-[4/3] w-full overflow-hidden">
          <img
            src={post.images[0]}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 text-xs text-muted-foreground">{timeAgo(post.created_time)}</div>

        {post.message && (
          <p className="mb-3 flex-1 text-sm leading-relaxed text-foreground/90">
            {displayMsg}
          </p>
        )}

        <div className="flex items-center gap-3 border-t pt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1" data-testid={`fb-post-reactions-${post.id}`}>
            <ThumbsUp className="h-3 w-3 text-[#1877F2]" />
            {post.reactions_count}
          </span>
          <span className="flex items-center gap-1" data-testid={`fb-post-comments-${post.id}`}>
            <MessageCircle className="h-3 w-3" />
            {post.comments_count}
          </span>
          <span className="flex items-center gap-1" data-testid={`fb-post-shares-${post.id}`}>
            <Share2 className="h-3 w-3" />
            {post.shares_count}
          </span>
        </div>
      </div>
    </button>
  );
}

const FB_PLUGIN_W = 500;
const FB_PLUGIN_H = 800;

function FacebookIframeEmbed({ pageSlug = "wislajawornik" }: { pageSlug?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setScale(containerRef.current.offsetWidth / FB_PLUGIN_W);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const src =
    `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(`https://www.facebook.com/${pageSlug}`)}` +
    `&tabs=timeline&width=${FB_PLUGIN_W}&height=${FB_PLUGIN_H}&small_header=false&adapt_container_width=false&hide_cover=false&show_facepile=true&locale=pl_PL`;

  return (
    <div
      ref={containerRef}
      className="mt-8 w-full overflow-hidden rounded-2xl"
      style={{ height: FB_PLUGIN_H * scale }}
      data-testid="facebook-embed-iframe"
    >
      <iframe
        src={src}
        width={FB_PLUGIN_W}
        height={FB_PLUGIN_H}
        style={{
          border: "none",
          overflow: "hidden",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        title="Facebook – Parafia Ewangelicka w Wiśle Jaworniku"
      />
    </div>
  );
}

function categorizeFbPosts(posts: FbPost[]) {
  const ogloszenia: FbPost[] = [];
  const wydarzenia: FbPost[] = [];

  for (const p of posts) {
    if (!p.images || p.images.length === 0) continue;
    if (!p.message && p.images.length === 0) continue;
    const msg = (p.message || "").toLowerCase();
    if (msg.startsWith("ogłoszenia parafialne")) {
      ogloszenia.push(p);
    } else if (msg.startsWith("polecamy nagranie")) {
      continue;
    } else {
      wydarzenia.push(p);
    }
  }

  return { ogloszenia, wydarzenia };
}

function FbScrollRow({ title, posts, onSelect }: { title: string; posts: FbPost[]; onSelect: (p: FbPost) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => { el.removeEventListener("scroll", checkScroll); window.removeEventListener("resize", checkScroll); };
  }, [posts]);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (posts.length === 0) return null;

  return (
    <div className="mt-8" data-testid={`fb-row-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-2xl tracking-tight">{title}</h3>
        <div className="flex gap-1">
          {canScrollLeft && (
            <button onClick={() => scroll(-1)} className="rounded-full border bg-card p-1.5 text-muted-foreground transition hover:bg-muted" aria-label="Przewiń w lewo">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {canScrollRight && (
            <button onClick={() => scroll(1)} className="rounded-full border bg-card p-1.5 text-muted-foreground transition hover:bg-muted" aria-label="Przewiń w prawo">
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {posts.map((p) => (
          <div key={p.id} className="w-[280px] flex-shrink-0 snap-start sm:w-[300px]">
            <FbPostCard post={p} onSelect={() => onSelect(p)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FacebookFeed() {
  const { data, isLoading } = useQuery<FbApiResponse>({
    queryKey: ["facebook-posts"],
    queryFn: () => apiFetch("/api/facebook-posts"),
    refetchInterval: 30 * 60 * 1000,
  });

  const posts = data?.posts ?? [];
  const pageSlug = data?.pageSlug || "wislajawornik";
  const hasNativeFeed = posts.length > 0;
  const [selectedPost, setSelectedPost] = useState<FbPost | null>(null);
  const { ogloszenia, wydarzenia } = categorizeFbPosts(posts);

  if (isLoading) {
    return (
      <div className="mt-8 flex justify-center py-12 text-muted-foreground" data-testid="facebook-loading">
        Ładowanie postów z Facebooka…
      </div>
    );
  }

  if (hasNativeFeed) {
    return (
      <>
        <FbScrollRow title="Wydarzenia" posts={wydarzenia} onSelect={setSelectedPost} />
        <FbScrollRow title="Ogłoszenia parafialne" posts={ogloszenia} onSelect={setSelectedPost} />
        {selectedPost && (
          <FbPostModal post={selectedPost} open={true} onClose={() => setSelectedPost(null)} />
        )}
      </>
    );
  }

  return <FacebookIframeEmbed pageSlug={pageSlug} />;
}
