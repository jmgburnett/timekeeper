/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as capabilities from "../capabilities.js";
import type * as crons from "../crons.js";
import type * as customers from "../customers.js";
import type * as http from "../http.js";
import type * as participants from "../participants.js";
import type * as reports from "../reports.js";
import type * as slack_api from "../slack/api.js";
import type * as slack_blocks from "../slack/blocks.js";
import type * as slack_handlers from "../slack/handlers.js";
import type * as timeEntries from "../timeEntries.js";
import type * as weeklySubmissions from "../weeklySubmissions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  capabilities: typeof capabilities;
  crons: typeof crons;
  customers: typeof customers;
  http: typeof http;
  participants: typeof participants;
  reports: typeof reports;
  "slack/api": typeof slack_api;
  "slack/blocks": typeof slack_blocks;
  "slack/handlers": typeof slack_handlers;
  timeEntries: typeof timeEntries;
  weeklySubmissions: typeof weeklySubmissions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
