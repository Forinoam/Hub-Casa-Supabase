/**
 * Family module: house/household surface (homes, members, invites).
 * Everything home-related is re-exported here so modules never reach into
 * shared services directly for household concerns.
 */
export {
  getCurrentHome,
  createNewHome,
  renameHome,
  updateHomeSettings,
  loadHomeContext,
  persistActiveHome,
  DEFAULT_HOME_SETTINGS,
} from "@/shared/services/home.service";
export type {
  HomeMembership,
  HomeRole,
  HomeSettings,
  HomeContextSnapshot,
} from "@/shared/services/home.service";

export {
  fetchHomeMembers,
  updateMemberRole,
  removeMember,
  transferOwnership,
} from "@/shared/services/members.service";

export * as invitesService from "./services/invites.service";
export type { Invite } from "./services/invites.service";
export { useInvites, useMyInvites } from "./hooks/useInvites";
