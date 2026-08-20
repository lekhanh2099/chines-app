import type {
 LearningProgressItem,
 LessonTextDisplaySettings,
 UserLearningState,
} from "@/features/hanzihome/types";
import {
 defaultLessonTextDisplaySettings,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";

type OptionalProgressItem = LearningProgressItem | undefined;

function mergeScalarField<T>(base: T, local: T, remote: T): T {
 return Object.is(local, base) ? remote : local;
}

function mergeLessonTextDisplayMode(
 base: UserLearningState["settings"]["lessonTextDisplayMode"],
 local: UserLearningState["settings"]["lessonTextDisplayMode"],
 remote: UserLearningState["settings"]["lessonTextDisplayMode"],
): LessonTextDisplaySettings | undefined {
 if (base === undefined && local === undefined && remote === undefined) return undefined;

 const baseValue = base ?? defaultLessonTextDisplaySettings;
 const localValue = local ?? defaultLessonTextDisplaySettings;
 const remoteValue = remote ?? defaultLessonTextDisplaySettings;

 return {
  showPinyin: mergeScalarField(baseValue.showPinyin, localValue.showPinyin, remoteValue.showPinyin),
  showMeaning: mergeScalarField(
   baseValue.showMeaning,
   localValue.showMeaning,
   remoteValue.showMeaning,
  ),
  showAnswers: mergeScalarField(
   baseValue.showAnswers,
   localValue.showAnswers,
   remoteValue.showAnswers,
  ),
  hanziFont: mergeScalarField(baseValue.hanziFont, localValue.hanziFont, remoteValue.hanziFont),
  hanziSize: mergeScalarField(baseValue.hanziSize, localValue.hanziSize, remoteValue.hanziSize),
  revealMode: mergeScalarField(baseValue.revealMode, localValue.revealMode, remoteValue.revealMode),
 };
}

function progressItemsEqual(left: OptionalProgressItem, right: OptionalProgressItem) {
 return (
  left?.level === right?.level &&
  left?.status === right?.status &&
  left?.lastReviewedAt === right?.lastReviewedAt
 );
}

function reviewedAtMs(item: OptionalProgressItem) {
 if (!item?.lastReviewedAt) return Number.NEGATIVE_INFINITY;
 const parsed = Date.parse(item.lastReviewedAt);
 return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function resolveConcurrentProgress(
 local: OptionalProgressItem,
 remote: OptionalProgressItem,
): OptionalProgressItem {
 if (local === undefined) return undefined;
 if (remote === undefined) return local;

 return reviewedAtMs(remote) > reviewedAtMs(local) ? remote : local;
}

function mergeProgressMap(
 base: Record<string, LearningProgressItem>,
 local: Record<string, LearningProgressItem>,
 remote: Record<string, LearningProgressItem>,
) {
 const merged = { ...remote };
 const ids = new Set([...Object.keys(base), ...Object.keys(local)]);

 for (const id of ids) {
  const baseItem = base[id];
  const localItem = local[id];
  if (progressItemsEqual(localItem, baseItem)) continue;

  const remoteItem = remote[id];
  const remoteChanged = !progressItemsEqual(remoteItem, baseItem);
  const resolved = remoteChanged ? resolveConcurrentProgress(localItem, remoteItem) : localItem;

  if (resolved === undefined) delete merged[id];
  else merged[id] = resolved;
 }

 return merged;
}

function mergeMembershipList(base: string[], local: string[], remote: string[]) {
 const baseSet = new Set(base);
 const localSet = new Set(local);
 const removedLocally = new Set(base.filter((id) => !localSet.has(id)));
 const merged = remote.filter((id) => !removedLocally.has(id));
 const mergedSet = new Set(merged);

 for (const id of local) {
  if (baseSet.has(id) || mergedSet.has(id)) continue;
  merged.push(id);
  mergedSet.add(id);
 }

 return merged;
}

function reviewKey(item: UserLearningState["reviewHistory"][number]) {
 return `${item.type}:${item.id}:${item.result}:${item.answeredAt}`;
}

/**
 * Rebase one pending local learning-state generation over the latest remote row.
 *
 * Conflict policy:
 * - scalar settings merge per field; a same-field conflict keeps the pending local intent;
 * - lesson display settings merge per nested field against the product defaults when absent;
 * - bookmark arrays are membership sets: local add/remove deltas apply to the latest remote set;
 * - progress items are atomic review snapshots. If both sides changed the same item, the later
 *   valid `lastReviewedAt` wins; an exact/missing timestamp tie keeps the pending local intent;
 * - local explicit progress deletion wins a same-item conflict because deletion has no review
 *   timestamp to compare;
 * - review history remains additive until P1-02 moves immutable evidence to its declared owner.
 */
export function mergeLearningStateAfterConflict({
 base,
 local,
 remote,
}: {
 base: UserLearningState;
 local: UserLearningState;
 remote: UserLearningState;
}): UserLearningState {
 const settings = { ...remote.settings };
 settings.lastCourseId = mergeScalarField(
  base.settings.lastCourseId,
  local.settings.lastCourseId,
  remote.settings.lastCourseId,
 );
 settings.lastLessonId = mergeScalarField(
  base.settings.lastLessonId,
  local.settings.lastLessonId,
  remote.settings.lastLessonId,
 );
 settings.lastModule = mergeScalarField(
  base.settings.lastModule,
  local.settings.lastModule,
  remote.settings.lastModule,
 );
 settings.density = mergeScalarField(
  base.settings.density,
  local.settings.density,
  remote.settings.density,
 );
 settings.vocabDetailTab = mergeScalarField(
  base.settings.vocabDetailTab,
  local.settings.vocabDetailTab,
  remote.settings.vocabDetailTab,
 );
 settings.lessonTextDisplayMode = mergeLessonTextDisplayMode(
  base.settings.lessonTextDisplayMode,
  local.settings.lessonTextDisplayMode,
  remote.settings.lessonTextDisplayMode,
 );

 const vocab = mergeProgressMap(
  base.progress.vocab ?? {},
  local.progress.vocab ?? {},
  remote.progress.vocab ?? {},
 );
 const grammar = mergeProgressMap(
  base.progress.grammar ?? {},
  local.progress.grammar ?? {},
  remote.progress.grammar ?? {},
 );

 const bookmarks = {
  lessons: mergeMembershipList(
   base.bookmarks.lessons ?? [],
   local.bookmarks.lessons ?? [],
   remote.bookmarks.lessons ?? [],
  ),
  vocab: mergeMembershipList(
   base.bookmarks.vocab ?? [],
   local.bookmarks.vocab ?? [],
   remote.bookmarks.vocab ?? [],
  ),
  grammar: mergeMembershipList(
   base.bookmarks.grammar ?? [],
   local.bookmarks.grammar ?? [],
   remote.bookmarks.grammar ?? [],
  ),
  radicals: mergeMembershipList(
   base.bookmarks.radicals ?? [],
   local.bookmarks.radicals ?? [],
   remote.bookmarks.radicals ?? [],
  ),
 };

 const baseReviewKeys = new Set(base.reviewHistory.map(reviewKey));
 const remoteReviewKeys = new Set(remote.reviewHistory.map(reviewKey));
 const reviewHistory = [...remote.reviewHistory];
 for (const item of local.reviewHistory) {
  const key = reviewKey(item);
  if (!baseReviewKeys.has(key) && !remoteReviewKeys.has(key)) {
   reviewHistory.push(item);
   remoteReviewKeys.add(key);
  }
 }

 return normalizeLearningState({
  settings,
  progress: { vocab, grammar },
  bookmarks,
  reviewHistory,
 });
}
