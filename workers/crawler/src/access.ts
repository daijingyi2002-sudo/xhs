export function detectSearchAccessBlocker(input: {
  title?: string;
  body?: string;
}) {
  const text = [input.title ?? "", input.body ?? ""].join(" ");

  if (
    /安全限制|安全验证|账号存在风险|当前账号存在风险|IP存在风险|访问过于频繁|异常流量|瀹夊叏闄愬埗|IP瀛樺湪椋庨櫓|璁块棶杩囦簬棰戠箒|寮傚父娴侀噺/.test(
      text
    )
  ) {
    return "search_access_blocked";
  }

  if (
    /登录后查看搜索结果|扫码登录|手机号登录|马上登录即可|鐧诲綍鍚庢煡鐪嬫悳绱㈢粨鏋渱鎵爜鐧诲綍|鎵嬫満鍙风櫥褰晐椹笂鐧诲綍鍗冲彲/.test(
      text
    )
  ) {
    return "search_requires_login";
  }

  return null;
}
