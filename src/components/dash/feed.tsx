import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import axios from "axios";

import feedHeaderImg from "../../img/dash/feed-header.svg";
import { listEducatorFeedPosts } from "../../controllers/feed/listEducatorFeedPosts.controller";
import { getCookies } from "../../controllers/misc/cookies.controller";

import "../../style/feed.css";

type TFeedPost = {
    id: number;
    title: string;
    body: string;
    imageUrl?: string | null;
    linkUrl?: string | null;
    linkLabel?: string | null;
};

function Feed() {
    const [posts, setPosts] = useState<TFeedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageSources, setImageSources] = useState<Record<number, string>>({});

    function resolveProtectedUrl(rawUrl?: string | null) {
        const value = String(rawUrl || "").trim();
        if (!value) return "";

        const apiBase = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
        const cdnBase = (process.env.REACT_APP_CDN_URL || "").replace(/\/+$/, "");
        const cdnPrefix = cdnBase ? `${cdnBase}/api/stream/` : "";

        if (cdnPrefix && value.startsWith(cdnPrefix)) {
            return `${apiBase}/files/stream/${encodeURIComponent(decodeURIComponent(value.slice(cdnPrefix.length)))}`;
        }

        if (value.startsWith(`${apiBase}/files/stream/`)) {
            return value;
        }

        if (value.startsWith("https://") || value.startsWith("http://")) {
            return value;
        }

        return `${apiBase}/files/stream/${encodeURIComponent(value)}`;
    }

    function sanitizeFeedHtml(html?: string | null) {
        const clean = DOMPurify.sanitize(String(html || ""), {
            USE_PROFILES: { html: true }
        });

        const container = document.createElement("div");
        container.innerHTML = clean;

        container.querySelectorAll("*").forEach(node => {
            const element = node as HTMLElement;
            element.style.whiteSpace = "normal";
            element.style.maxWidth = "100%";

            if (element.style.display === "inline-flex" || element.style.display === "flex") {
                element.style.display = "inline";
            }
        });

        return container.innerHTML;
    }

    useEffect(() => {
        async function loadPosts() {
            try {
                const response = await listEducatorFeedPosts();
                setPosts(Array.isArray(response) ? response : []);
            } catch (error) {
                console.error("Erro ao carregar feed do educador:", error);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        }

        loadPosts();
    }, []);

    useEffect(() => {
        let cancelled = false;
        const generatedUrls: string[] = [];

        async function loadImages() {
            const authToken = getCookies("authToken");
            const nextSources: Record<number, string> = {};

            await Promise.all(
                posts.map(async post => {
                    const resolvedUrl = resolveProtectedUrl(post.imageUrl);
                    if (!resolvedUrl) return;

                    try {
                        if (resolvedUrl.startsWith(`${process.env.REACT_APP_API_URL}/files/stream/`) && authToken) {
                            const response = await axios.get(resolvedUrl, {
                                responseType: "blob",
                                headers: {
                                    Authorization: `Bearer ${authToken}`
                                }
                            });

                            const objectUrl = URL.createObjectURL(response.data);
                            generatedUrls.push(objectUrl);
                            nextSources[post.id] = objectUrl;
                            return;
                        }

                        nextSources[post.id] = resolvedUrl;
                    } catch (error) {
                        console.error("Erro ao carregar imagem do feed:", error);
                    }
                })
            );

            if (!cancelled) {
                setImageSources(nextSources);
                return;
            }

            generatedUrls.forEach(url => URL.revokeObjectURL(url));
        }

        loadImages();

        return () => {
            cancelled = true;
            generatedUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [posts]);

    return (
        <div className="feed-container">
            <div className="feed-header">
                <img src={feedHeaderImg} alt="header-image" />
            </div>

            <div className="feed-content">
                <b className="title">FEED DE NOVIDADES</b>

                {loading ? <div className="feed-empty">Carregando publicações...</div> : null}

                {!loading && posts.length === 0 ? (
                    <div className="feed-empty">Nenhuma publicação disponível no momento.</div>
                ) : null}

                {posts.map((post, index) => {
                    const imageFirst = index % 2 === 1;
                    const imageSrc = imageSources[post.id];

                    return (
                        <div key={post.id} className={`feed-item ${imageFirst ? "image-first" : ""}`}>
                            {!imageFirst ? (
                                <div className="text-wrapper">
                                    <b>{post.title}</b>
                                    <div
                                        className="feed-body"
                                        dangerouslySetInnerHTML={{ __html: sanitizeFeedHtml(post.body) }}
                                    />
                                    {post.linkUrl ? (
                                        <a href={post.linkUrl} target="_blank" rel="noreferrer">
                                            {post.linkLabel || "Saiba mais"}
                                        </a>
                                    ) : null}
                                </div>
                            ) : null}

                            {imageSrc ? (
                                <div className="image-wrapper">
                                    <img src={imageSrc} alt={post.title} />
                                </div>
                            ) : null}

                            {imageFirst ? (
                                <div className="text-wrapper">
                                    <b>{post.title}</b>
                                    <div
                                        className="feed-body"
                                        dangerouslySetInnerHTML={{ __html: sanitizeFeedHtml(post.body) }}
                                    />
                                    {post.linkUrl ? (
                                        <a href={post.linkUrl} target="_blank" rel="noreferrer">
                                            {post.linkLabel || "Saiba mais"}
                                        </a>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
            
        </div>
    )
}

export default Feed;
