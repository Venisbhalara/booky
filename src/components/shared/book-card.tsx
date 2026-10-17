"use client";

import Link from "next/link";
import { formatINR } from "@/lib/format";
import { AARDVARK_PALETTE } from "@/lib/aardvark-html";

export type BookCardData = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  photos: string[];
  condition: string;
  mode: string;
  dailyRate: number | null;
  freeMaxDays: number | null;
  depositAmount: number;
  category: string | null;
  distanceKm?: number | null;
  ownerName?: string | null;
};

function pickColorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AARDVARK_PALETTE[hash % AARDVARK_PALETTE.length];
}

function getContrastTextColor(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#000000";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

export function BookCard({ book }: { book: BookCardData }) {
  const img =
    book.photos[0] ??
    book.coverUrl ??
    "https://cdn.prod.website-files.com/69a33078e92fb49d85319481/6abc21098082ac38be134eeb_earlyvenusvanishing.png";
  const bgColor = pickColorForId(book.id || book.title);
  const textColor = getContrastTextColor(bgColor);
  const isFree = book.mode === "FREE";

  const priceTag = isFree
    ? "Free Borrow"
    : `${formatINR(book.dailyRate ?? 0)}/day`;

  const distanceLabel =
    book.distanceKm != null
      ? book.distanceKm < 1
        ? `${Math.round(book.distanceKm * 1000)}m away`
        : `${book.distanceKm.toFixed(1)}km away`
      : null;

  return (
    <div
      data-check-contrast=""
      className="books-slider__list-item is--books-list w-dyn-item"
      style={{ width: "100%" }}
    >
      <article
        className="books-slider__item is--books-list"
        style={{ width: "100%" }}
      >
        <div className="books-slider__item-inner">
          <div
            data-check-contrast-bg=""
            style={{ backgroundColor: bgColor }}
            className="books-slider__item-bg"
          >
            {/* Pop-up Aardvark Ears on Hover */}
            <div
              style={{ color: bgColor }}
              className="books-slider__item-bg-ears"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 44 45"
                width="100%"
                className="books-slider__item-bg-left-ear"
              >
                <path
                  fill="currentColor"
                  d="M1.335.198c.671-.316 1.5-.254 2.186.187C27.678 16.847 39.839 36.953 44 45h-6.048c-2.382-1.604-6.964-3.674-15.652-4.814C2.999 37.666-.665 14.174.09 2.04.152 1.28.589.515 1.335.198Z"
                ></path>
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 29 80"
                width="100%"
                className="books-slider__item-bg-right-ear"
              >
                <path
                  fill="currentColor"
                  d="M19.388.879c.667-.771 1.647-1.018 2.559-.807.912.21 1.682.956 1.926 1.861C34.595 38.09 25.79 69.237 21.823 80h-4.188c-.17-4.22-2.739-13.318-10.975-22.064-8.493-9.099-8.88-21.913-1.063-37.23C11.221 9.603 19.091 1.266 19.388.879Z"
                ></path>
              </svg>
            </div>
            <div
              style={{ backgroundColor: bgColor }}
              className="books-slider__item-bg-bottom"
            ></div>
            {/* Bottom Pull-Tab CTA on Hover */}
            <div className="books-slider__item-cta">
              <div className="button-alt">
                <span className="button-alt__text-wrap">
                  <span className="button-alt__bg"></span>
                  <span className="button-alt__text-outer">
                    <span className="button-alt__text">Borrow / View</span>
                  </span>
                </span>
                <span className="button-alt__icon-wrap">
                  <span className="button-alt__bg"></span>
                  <span className="button-alt__icon-outer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100%"
                      viewBox="0 0 14 13"
                      fill="none"
                      aria-hidden="true"
                      className="button-alt__icon"
                    >
                      <path
                        d="M13.58 5.66v.845l-5.994 5.66-1.71-2.063a61.427 61.427 0 0 1 4.265-2.988l-.02-.078c-1.828.196-4.107.294-6.387.294H0V4.835h3.734c2.28 0 4.56.098 6.387.294l.02-.059a67.638 67.638 0 0 1-4.265-3.006L7.586 0l5.994 5.66Z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="books-slider__item-container">
            <div className="books-slider__item-cover">
              <img
                src={img}
                loading="lazy"
                alt={book.title}
                className="books-slider__item-img"
              />
            </div>

            <div className="books-slider__item-content">
              <div className="books-slider__item-text">
                <h3
                  data-check-contrast-text=""
                  style={{ color: textColor }}
                  className="books-slider__item-title u-heading-s"
                >
                  {book.title}
                </h3>
                <div
                  data-check-contrast-text=""
                  style={{ color: textColor }}
                  className="books-slider__item-paragraph u-paragraph-small w-richtext"
                >
                  <p>
                    By <strong>{book.author ?? "Featured Author"}</strong> · Deposit{" "}
                    {formatINR(book.depositAmount)} ({book.condition})
                  </p>
                </div>
              </div>

              <div className="books-slider__genre-list-wrap w-dyn-list">
                <div role="list" className="books-slider__genre-list w-dyn-items">
                  <div role="listitem" className="books-slider__genre-list-item w-dyn-item">
                    <span
                      style={{ backgroundColor: "#69fe6f", color: "black" }}
                      className="tag-small"
                    >
                      <span className="tag-small__text">{priceTag}</span>
                    </span>
                  </div>
                  {book.category && (
                    <div role="listitem" className="books-slider__genre-list-item w-dyn-item">
                      <span
                        style={{ backgroundColor: "#00ecef", color: "black" }}
                        className="tag-small"
                      >
                        <span className="tag-small__text">{book.category}</span>
                      </span>
                    </div>
                  )}
                  {distanceLabel && (
                    <div role="listitem" className="books-slider__genre-list-item w-dyn-item">
                      <span
                        style={{ backgroundColor: "#ff9d00", color: "black" }}
                        className="tag-small"
                      >
                        <span className="tag-small__text">{distanceLabel}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Link
            aria-label={`View ${book.title}`}
            href={`/book/${book.id}`}
            className="books-slider__item-link w-inline-block"
          />
        </div>
      </article>
    </div>
  );
}
