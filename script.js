// 画像を追加・変更するときは、この配列を編集してください。
// ファイルは images フォルダに置き、path に相対パスを指定します。
const images = [
  { title: "Photo 01", path: "images/photo1.jpg", filename: "photo1.jpg" },
  { title: "Photo 02", path: "images/photo2.jpg", filename: "photo2.jpg" },
  { title: "Photo 03", path: "images/photo3.jpg", filename: "photo3.jpg" }
];

const gallery = document.getElementById("gallery");
const notice = document.getElementById("notice");
const downloadAllButton = document.getElementById("download-all");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxCaption = document.getElementById("lightbox-caption");

function setNotice(message) {
  notice.textContent = message;
}

function renderGallery() {
  gallery.innerHTML = "";

  images.forEach((item) => {
    const card = document.createElement("article");
    card.className = "photo-card";

    const previewButton = document.createElement("button");
    previewButton.className = "photo-frame";
    previewButton.type = "button";
    previewButton.setAttribute("aria-label", `${item.title}を拡大表示`);

    const image = document.createElement("img");
    image.src = item.path;
    image.alt = item.title;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      image.alt = `${item.title}：画像を読み込めません。imagesフォルダ内のファイル名を確認してください。`;
      previewButton.style.cursor = "default";
      previewButton.disabled = true;
      setNotice(`${item.filename} が見つかりません。READMEの手順で画像を配置してください。`);
    });

    previewButton.appendChild(image);
    previewButton.addEventListener("click", () => {
      if (!image.naturalWidth) return;
      lightboxImage.src = item.path;
      lightboxImage.alt = item.title;
      lightboxCaption.textContent = item.title;
      lightbox.showModal();
    });

    const info = document.createElement("div");
    info.className = "photo-info";

    const title = document.createElement("h2");
    title.className = "photo-title";
    title.textContent = item.title;

    const downloadButton = document.createElement("button");
    downloadButton.className = "button";
    downloadButton.type = "button";
    downloadButton.innerHTML = '<span aria-hidden="true">↓</span> 保存';
    downloadButton.addEventListener("click", () => downloadOne(item, downloadButton));

    info.append(title, downloadButton);
    card.append(previewButton, info);
    gallery.appendChild(card);
  });
}

async function fetchImage(item) {
  const response = await fetch(item.path);
  if (!response.ok) throw new Error(`${item.filename} を取得できませんでした`);
  return response.blob();
}

async function downloadOne(item, button) {
  button.disabled = true;
  const oldText = button.textContent;
  button.textContent = "準備中…";

  try {
    const blob = await fetchImage(item);
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = item.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setNotice(`${item.filename} のダウンロードを開始しました。`);
  } catch (error) {
    setNotice(`${error.message}。画像ファイルの配置を確認してください。`);
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

downloadAllButton.addEventListener("click", async () => {
  if (typeof JSZip === "undefined") {
    setNotice("ZIPライブラリを読み込めませんでした。インターネット接続を確認してください。");
    return;
  }

  downloadAllButton.disabled = true;
  downloadAllButton.textContent = "ZIPを作成中…";

  try {
    const zip = new JSZip();
    const results = await Promise.all(
      images.map(async (item) => ({ item, blob: await fetchImage(item) }))
    );

    results.forEach(({ item, blob }) => zip.file(item.filename, blob));
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const objectUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "photo-gallery.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setNotice("ZIPファイルのダウンロードを開始しました。");
  } catch (error) {
    setNotice(`一括ダウンロードに失敗しました。${error.message}`);
  } finally {
    downloadAllButton.disabled = false;
    downloadAllButton.innerHTML = '<span aria-hidden="true">↓</span> すべてダウンロード（ZIP）';
  }
});

document.getElementById("lightbox-close").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

renderGallery();
