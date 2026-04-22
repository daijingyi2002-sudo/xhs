import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { companies, plazaPosts } from "@xhs/domain";
import { notFound } from "next/navigation";

export default async function PlazaPostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = plazaPosts.find((item) => item.id === postId);

  if (!post) notFound();

  const company = companies.find((item) => item.id === post.companyId);
  const qrDataUrl = post.sourceUrl
    ? await QRCode.toDataURL(post.sourceUrl, {
        margin: 1,
        width: 256,
        color: {
          dark: "#161616",
          light: "#fffdf8"
        }
      })
    : null;

  return (
    <main className="page-stack">
      <div className="detail-grid">
        <div className="detail-panel-stack">
          <article className="detail-panel">
            <p className="section-eyebrow">{company?.name}</p>
            <h2 className="detail-title">{post.title}</h2>
            <p className="detail-copy">{post.excerpt}</p>
          </article>
          <article className="detail-panel">
            <p className="section-eyebrow">Source Context</p>
            <ul className="detail-list">
              <li>帖子主题: {post.topic}</li>
              <li>面试阶段: {post.stage}</li>
              <li>发布时间: {post.publishTime}</li>
              <li>OCR 关键词: {post.ocrText}</li>
              <li>标签表述: {post.confidenceLabel}</li>
            </ul>
          </article>
        </div>

        <div className="detail-panel-stack">
          <article className="detail-panel">
            <p className="section-eyebrow">Original Post QR</p>
            {qrDataUrl ? (
              <div className="qr-panel">
                <Image src={qrDataUrl} alt="Original post QR code" width={180} height={180} className="qr-image" />
                <small className="plaza-small">用户可扫码后在 App 内打开原帖。这个动作不应该阻塞主流程。</small>
              </div>
            ) : (
              <p className="helper-copy">当前帖子没有可用的 source URL，因此隐藏扫码跳转。</p>
            )}
          </article>

          <article className="detail-panel">
            <p className="section-eyebrow">Back To Funnel</p>
            <div className="pill-row">
              <Link href={`/jobs/${post.roleId}`} className="primary-button">
                回到岗位分析
              </Link>
              <Link href={`/interview/${post.roleId}`} className="ghost-button">
                直接去模拟面试
              </Link>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
