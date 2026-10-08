/** Graph messageId — BE는 applicantResponses.outlookUrl 필드에 담아 내려줌 */
export function openMailPreview(messageId: string) {
  const id = messageId.trim();
  if (!id) return;

  window.open(
    `/admin/mail-preview?messageId=${encodeURIComponent(id)}`,
    "_blank",
    "width=960,height=800",
  );
}
