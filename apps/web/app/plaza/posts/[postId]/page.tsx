import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { plazaPosts } from "@xhs/domain";
import { plazaInsights } from "../../../../lib/plaza-placeholder-content";
import { PlazaDetailChrome } from "../../../../components/plaza-chrome";

export default async function PlazaPostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = plazaPosts.find((item) => item.id === postId);
  const insight = plazaInsights.find((item) => item.href.endsWith(`/plaza/posts/${postId}`));

  if (!post && !insight) notFound();

  const sourceUrl = post?.sourceUrl;
  const qrDataUrl = sourceUrl
    ? await QRCode.toDataURL(sourceUrl, {
        margin: 1,
        width: 256,
        color: {
          dark: "#111c2c",
          light: "#ffffff"
        }
      })
    : null;

  const roleId = post?.roleId ?? "placeholder-ai-pm-01";

  return (
    <PlazaDetailChrome>
      <section className="plaza-post-detail">
        <article className="plaza-post-main">
          <p>Interview Insight</p>
          <h1>{insight?.title ?? post?.title}</h1>
          <span>{insight?.summary ?? post?.excerpt}</span>

          <div className="plaza-detail-facts">
            <div>
              <strong>{insight?.company ?? "AI 产品经理"}</strong>
              <span>公司 / 角色线索</span>
            </div>
            <div>
              <strong>{insight?.stage ?? post?.stage}</strong>
              <span>面试阶段</span>
            </div>
            <div>
              <strong>{insight?.topic ?? post?.topic}</strong>
              <span>内容主题</span>
            </div>
          </div>
        </article>

        <aside className="plaza-post-side">
          <article>
            <p>Original Post QR</p>
            {qrDataUrl ? (
              <div className="qr-panel">
                <Image src={qrDataUrl} alt="Original post QR code" width={180} height={180} className="qr-image" />
                <small className="plaza-small">扫码后打开原始帖子；二维码是增强层，不阻塞主流程。</small>
              </div>
            ) : (
              <span>当前内容没有可用 source URL，因此隐藏扫码跳转。</span>
            )}
          </article>

          <article>
            <p>Back To Funnel</p>
            <div className="plaza-card-actions">
              <Link href={`/jobs/${roleId}`} className="jobs-primary-action">
                回到岗位分析
              </Link>
              <Link href={`/interview/${roleId}`} className="jobs-outline-action">
                直接模拟面试
              </Link>
            </div>
          </article>
        </aside>
      </section>
    </PlazaDetailChrome>
  );
}
