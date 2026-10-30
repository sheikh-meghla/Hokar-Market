"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
  ChevronRight,
  Check,
} from "lucide-react";
import { useLanguage } from "../../components/language-provider";
import SiteHeader from "../../components/site-header";
import SiteFooter from "../../components/site-footer";
import { addToCart } from "@/lib/cart";
import type { CatalogItem, CategoryKey, ProductView } from "@/lib/catalog";
import type { TranslationKey } from "@/lib/translations";

const colorLabels: Record<string, TranslationKey> = {
  Gold: "colorGold",
  Silver: "colorSilver",
  "Rose Gold": "colorRoseGold",
};

const categoryLabelKey: Record<CategoryKey, TranslationKey> = {
  ring: "navRings",
  necklace: "navNecklaces",
  bracelet: "navBracelets",
};

type MessageKey = "msgSelectSize" | "msgAddedToCart" | "msgAddFailed";

export default function ProductDetails({
  product,
  related,
}: {
  product: ProductView;
  related: CatalogItem[];
}) {
  const { t, l, formatNumber } = useLanguage();
  const images = product.images;
  const sizes = product.sizes;
  const colors = product.colors;
  const relatedProducts = related;
  const inStock = product.stock > 0;
  const maxQuantity = Math.min(10, Math.max(1, product.stock));

  const [selectedImage, setSelectedImage] = useState(0);
  const [color, setColor] = useState(colors[0] ?? "");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [wishlist, setWishlist] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const [message, setMessage] = useState<MessageKey | null>(null);

  // A discount is shown only when the product has a real original price.
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const colorText = (value: string) =>
    colorLabels[value] ? t(colorLabels[value]) : value;

  const detailParts = [
    colors.length > 0 &&
      `${t("availableColors")}: ${colors.map(colorText).join(", ")}`,
    sizes.length > 0 && t("accSizeNote"),
  ].filter(Boolean) as string[];

  const accordions = [
    { title: t("accDeliveryTitle"), content: t("accDeliveryContent") },
    { title: t("accReturnTitle"), content: t("accReturnContent") },
    ...(detailParts.length > 0
      ? [{ title: t("accDetailsTitle"), content: detailParts.join(". ") }]
      : []),
  ];

  const categoryHref = `/${product.category}`;

  function addProductToCart() {
    if (sizes.length > 0 && !size) {
      setMessage("msgSelectSize");
      return;
    }

    try {
      addToCart(
        {
          id: product.id,
          slug: product.slug,
          name: product.name.en,
          nameBn: product.name.bn,
          price: product.price,
          image: images[0],
          color: color || undefined,
          size: size || undefined,
        },
        quantity
      );
      setMessage("msgAddedToCart");
    } catch {
      setMessage("msgAddFailed");
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#263e55]">
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 py-4 text-[11px] text-[#8494a4]">
          <Link href="/" className="hover:text-[#526d84]">{t("breadcrumbHome")}</Link>
          <ChevronRight size={12} />
          <Link href={categoryHref} className="hover:text-[#526d84]">
            {t(categoryLabelKey[product.category])}
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#263e55]">{l(product.name)}</span>
        </div>

        {/* Product layout */}
        <section className="grid grid-cols-1 items-start gap-7 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-8 lg:gap-12">
          {/* Gallery */}
          <div
            className={`grid gap-3 sm:gap-4 ${
              images.length > 1
                ? "grid-cols-[54px_minmax(0,1fr)] sm:grid-cols-[66px_minmax(0,1fr)]"
                : "grid-cols-1"
            }`}
          >
            {images.length > 1 && (
              <div className="flex flex-col gap-2.5">
                {images.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setSelectedImage(index)}
                    aria-label={t("selectImage", { n: formatNumber(index + 1) })}
                    className={`overflow-hidden rounded-md border bg-[#f6f6f5] p-0.5 ${
                      selectedImage === index
                        ? "border-[#526d84] ring-1 ring-[#526d84]"
                        : "border-[#e7e9eb]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={t("thumbnailAlt", { name: l(product.name), n: formatNumber(index + 1) })}
                      className="aspect-square w-full rounded object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f5f5f4]">
              {discount > 0 && (
                <span className="absolute left-3 top-3 z-10 rounded-full bg-[#526d84] px-3 py-1 text-[10px] font-medium text-white sm:left-4 sm:top-4 sm:text-xs">
                  -{formatNumber(discount)}%
                </span>
              )}

              <button
                onClick={() => setWishlist(!wishlist)}
                aria-label={t("toggleWishlist")}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition hover:scale-105 sm:right-4 sm:top-4 sm:h-9 sm:w-9"
              >
                <Heart
                  size={17}
                  className={wishlist ? "fill-rose-500 text-rose-500" : ""}
                />
              </button>

              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[selectedImage] ?? images[0]}
                  alt={l(product.name)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl text-[#c6d5e4]">
                  ♡
                </div>
              )}
            </div>
          </div>

          {/* Product information */}
          <div className="pb-2">
            <p className="mb-2 text-[10px] uppercase tracking-[2px] text-[#7e92a6]">
              {t(categoryLabelKey[product.category])}
            </p>

            <h1 className="font-serif text-[28px] leading-tight sm:text-3xl lg:text-[36px]">
              {l(product.name)}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xl font-semibold sm:text-2xl">
                ৳{formatNumber(product.price)}
              </span>
              {product.oldPrice && (
                <>
                  <span className="text-xs text-[#9ba7b2] line-through">
                    ৳{formatNumber(product.oldPrice)}
                  </span>
                  <span className="rounded-full bg-[#edf2f6] px-2 py-1 text-[10px] text-[#526d84]">
                    {t("saveDiscount", { discount: formatNumber(discount) })}
                  </span>
                </>
              )}
            </div>

            <p className="mt-4 text-[12px] leading-6 text-[#6c8195]">
              {l(product.description)}
            </p>

            <div className="my-4 h-px bg-[#e8edf1]" />

            {/* Color */}
            {colors.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-medium">
                  {t("color")}:{" "}
                  <span className="font-normal">{colorText(color)}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((item) => (
                    <button
                      key={item}
                      onClick={() => setColor(item)}
                      className={`rounded-md border px-3 py-2 text-[11px] transition ${
                        color === item
                          ? "border-[#526d84] bg-[#f0f4f7]"
                          : "border-[#e0e7ed] hover:border-[#8299ae]"
                      }`}
                    >
                      {colorText(item)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {sizes.length > 0 && (
              <div className="mb-4">
                <label htmlFor="product-size" className="mb-2 block text-[11px] font-medium">
                  {t("size")}
                </label>
                <select
                  id="product-size"
                  value={size}
                  onChange={(event) => {
                    setSize(event.target.value);
                    setMessage(null);
                  }}
                  className="w-full rounded-md border border-[#dfe6ec] bg-white px-3 py-2.5 text-[11px] outline-none focus:border-[#526d84]"
                >
                  <option value="">{t("selectSize")}</option>
                  {sizes.map((item) => (
                    <option key={item} value={item}>
                      {t("sizeOption", { n: formatNumber(Number(item)) })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Stock */}
            <div className="mb-4 flex items-center gap-2 text-[11px]">
              <span className={`h-2 w-2 rounded-full ${inStock ? "bg-[#39b76a]" : "bg-rose-500"}`} />
              <span>{inStock ? t("inStock") : t("outOfStock")}</span>
            </div>

            {/* Quantity */}
            <div className="mb-4 flex items-center gap-3">
              <span className="text-[11px]">{t("quantity")}</span>
              <div className="flex h-8 items-center overflow-hidden rounded-md border border-[#e0e7ed]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label={t("decreaseQuantity")}
                  className="px-2.5 hover:bg-[#f0f4f7]"
                >
                  <Minus size={13} />
                </button>
                <span className="min-w-7 text-center text-[11px]">
                  {formatNumber(quantity)}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  aria-label={t("increaseQuantity")}
                  className="px-2.5 hover:bg-[#f0f4f7]"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                onClick={addProductToCart}
                disabled={!inStock}
                className="flex items-center justify-center gap-2 rounded-md border border-[#91a4b5] px-3 py-3 text-[11px] transition hover:bg-[#f0f4f7] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart size={15} />
                {t("addToCart")}
              </button>

              <button
                onClick={addProductToCart}
                disabled={!inStock}
                className="flex items-center justify-center gap-2 rounded-md bg-[#526d84] px-3 py-3 text-[11px] text-white transition hover:bg-[#3d566d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("buyNow")} <ChevronRight size={15} />
              </button>
            </div>

            {message && (
              <p
                role="status"
                className={`mt-3 rounded-md p-2.5 text-xs ${
                  message === "msgAddedToCart"
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                {t(message)}
                {message === "msgAddedToCart" && (
                  <>
                    {" "}
                    <Link href="/cart" className="font-medium underline">
                      {t("shoppingCart")}
                    </Link>
                  </>
                )}
              </p>
            )}

            {/* Benefits */}
            <div className="mt-5 space-y-3 border-t border-[#e8edf1] pt-4">
              <div className="flex items-start gap-3">
                <Truck size={15} className="mt-0.5 shrink-0 text-[#718ba1]" />
                <div>
                  <p className="text-[11px] font-medium">{t("deliveryInformation")}</p>
                  <p className="mt-1 text-[10px] text-[#8798a8]">
                    {t("deliveryShort")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw size={15} className="mt-0.5 shrink-0 text-[#718ba1]" />
                <div>
                  <p className="text-[11px] font-medium">{t("returnExchange")}</p>
                  <p className="mt-1 text-[10px] text-[#8798a8]">
                    {t("returnShort")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#718ba1]" />
                <div>
                  <p className="text-[11px] font-medium">{t("secureShopping")}</p>
                  <p className="mt-1 text-[10px] text-[#8798a8]">
                    {t("secureShort")}
                  </p>
                </div>
              </div>
            </div>

            {/* Expandable information */}
            <div className="mt-4 border-t border-[#e8edf1]">
              {accordions.map((item, index) => (
                <div key={index} className="border-b border-[#e8edf1]">
                  <button
                    onClick={() =>
                      setOpenAccordion(openAccordion === index ? null : index)
                    }
                    aria-expanded={openAccordion === index}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left text-[11px] font-medium"
                  >
                    {item.title}
                    {openAccordion === index ? (
                      <Minus size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                  </button>
                  {openAccordion === index && (
                    <p className="pb-3 text-[11px] leading-5 text-[#7a8da0]">
                      {item.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 border-t border-[#e8edf1] pt-8 sm:mt-14 sm:pt-10">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="mb-1.5 text-[9px] uppercase tracking-[2px] text-[#8296a9]">
                  {t("youMayAlsoLike")}
                </p>
                <h2 className="font-serif text-2xl sm:text-[27px]">
                  {t("relatedProducts")}
                </h2>
              </div>
              <Link
                href={categoryHref}
                className="flex items-center gap-1 pb-1 text-[10px] text-[#526d84] sm:text-xs"
              >
                {t("viewAll")} <ChevronRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {relatedProducts.map((item) => (
                <article
                  key={item.id}
                  className="group min-w-0 overflow-hidden rounded-lg border border-[#e7edf2] bg-white transition hover:shadow-md"
                >
                  <Link href={`/products/${item.slug}`} className="block">
                    <div className="relative overflow-hidden bg-[#f5f5f4]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image ?? ""}
                        alt={l(item.name)}
                        className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-2 sm:p-2.5">
                      <p className="truncate text-[10px] font-medium sm:text-[11px]">
                        {l(item.name)}
                      </p>
                      <p className="mt-1.5 text-[11px] font-semibold">
                        ৳{formatNumber(item.price)}
                      </p>
                      <span className="mt-2.5 flex items-center justify-center gap-1 rounded bg-[#edf2f6] px-1 py-2 text-[9px] text-[#526d84] transition group-hover:bg-[#526d84] group-hover:text-white sm:text-[10px]">
                        <ShoppingCart size={12} />
                        {t("viewProduct")}
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Gift banner */}
        <section className="relative mt-9 flex min-h-[175px] items-center overflow-hidden rounded-lg bg-gradient-to-r from-[#f0f3f8] via-[#fafbfd] to-[#e3ebf4] px-5 py-7 sm:mt-12 sm:px-10">
          <div className="relative z-10 max-w-md">
            <p className="mb-1 text-[10px] text-[#7e93a7]">
              {t("giftBannerEyebrow")}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl">
              {t("sendAsGift")}
            </h2>
            <p className="mt-2 text-[11px] text-[#7e91a3]">
              {t("giftBannerText")}
            </p>
            <Link
              href="/collections/gifts"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[10px] shadow-sm transition hover:bg-[#526d84] hover:text-white"
            >
              {t("discoverGifts")} <ChevronRight size={13} />
            </Link>
          </div>
          <div className="pointer-events-none absolute -right-2 -top-8 font-serif text-[180px] leading-none text-[#c6d5e4]/60 sm:right-10 sm:text-[210px]">
            ♡
          </div>
        </section>

        {/* Service cards */}
        <section className="my-6 grid grid-cols-2 gap-2 sm:my-7 sm:grid-cols-4 sm:gap-3">
          {[
            { icon: <Truck size={18} />, title: t("serviceFreeDeliveryTitle"), sub: t("serviceFreeDeliverySub") },
            { icon: <ShieldCheck size={18} />, title: t("serviceSecureTitle"), sub: t("serviceSecureSub") },
            { icon: <RotateCcw size={18} />, title: t("serviceReturnsTitle"), sub: t("serviceReturnsSub") },
            { icon: <Check size={18} />, title: t("serviceSupportTitle"), sub: t("serviceSupportSub") },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center rounded-lg border border-[#e8edf1] px-2 py-4 text-center"
            >
              <span className="mb-2 text-[#718ba1]">{item.icon}</span>
              <p className="text-[10px] font-medium">{item.title}</p>
              <p className="mt-1 text-[9px] text-[#8798a8]">{item.sub}</p>
            </div>
          ))}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
