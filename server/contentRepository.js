// Repository PostgreSQL injectable (runtime = cimes_app). Aucune logique métier ici.
import { neonDb } from "./db.js";

export function neonContentRepository(db = neonDb) {
  return {
    getSessionByTokenHash: (th) => db.getSessionByTokenHash(th),
    getPublished: () => db.getPublished(),
    getDraftState: () => db.getDraftState(),                       // { content, publishedVersion, draftRevision, updatedAt }
    saveDraft: (adminId, expectedVersion, expectedRevision, content) => db.saveDraft(adminId, expectedVersion, expectedRevision, content),
    getDraftContent: () => db.getDraftContent(),
    publish: (adminId, expectedVersion, expectedRevision) => db.publish(adminId, expectedVersion, expectedRevision),
    listVersions: (limit, cursor) => db.listVersions(limit, cursor),
    getVersionContent: (versionId) => db.getVersionContent(versionId),
    restore: (adminId, expectedVersion, expectedRevision, versionId) => db.restore(adminId, expectedVersion, expectedRevision, versionId),
  };
}
