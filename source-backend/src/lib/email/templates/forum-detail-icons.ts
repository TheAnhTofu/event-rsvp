/**
 * Re-export getters for forum row icons in HTML emails.
 * URLs resolve từ env (S3) hoặc fallback Figma — xem `email-assets.ts`.
 */
export {
  getForumDetailCalendarIconUrl,
  getForumDetailLocationIconUrl,
  getForumDetailGlobeIconUrl,
} from "../email-assets";
