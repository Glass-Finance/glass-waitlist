// Generic helper for a server-paginated list endpoint: given a function
// that fetches one page by number, pages through until the response
// signals there's nothing left, concatenating every page.
//
// Several community-scoped list endpoints (members, obligations,
// transactions) request a generous page size but are still, in principle,
// server-paginated -- for a community large enough to exceed that page
// size, trusting a single fetch would silently truncate whatever the
// caller derives from it (a headcount, a "Total Collected" figure, a
// per-member paid/unpaid status). See AUDIT_REPORT.md, F03/F16.
export async function fetchAllPages(fetchPage) {
  let all = [];
  let pageNumber = 0;
  while (true) {
    const res = await fetchPage(pageNumber);
    const data = res.data?.data;
    const items = Array.isArray(data) ? data : (data?.content ?? []);
    all = all.concat(items);
    const isLast = Array.isArray(data) ? true : (data?.last ?? items.length < 1000);
    if (isLast || items.length === 0) break;
    pageNumber += 1;
  }
  return all;
}
