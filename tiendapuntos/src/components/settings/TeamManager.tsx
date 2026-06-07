"use client";

import { useFormState } from "react-dom";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { deleteTeamMemberAction } from "@/lib/actions/settings";
import { createInvitationAction, revokeInvitationAction } from "@/lib/actions/invitations";
import { SubmitButton } from "@/components/SubmitButton";
import { CopyField } from "@/components/CopyField";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
};

export function TeamManager({
  members,
  invitations,
  currentUserId,
}: {
  members: Member[];
  invitations: Invitation[];
  currentUserId: string;
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const tr = useTranslations("roles");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(createInvitationAction, undefined);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-gray-100">
        {members.map((m) => {
          const del = async () => {
            await deleteTeamMemberAction(m.id);
          };
          return (
            <li key={m.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">
                  {m.name}
                  {m.id === currentUserId && (
                    <span className="ml-2 text-xs text-gray-400">{t("you")}</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">{m.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge bg-gray-100 text-gray-600">{tr(m.role)}</span>
                {m.role !== "OWNER" && m.id !== currentUserId && (
                  <form
                    action={del}
                    onSubmit={(e) => {
                      if (!window.confirm(t("deleteMemberConfirm", { name: m.name }))) e.preventDefault();
                    }}
                  >
                    <button className="text-sm text-red-600 hover:underline" type="submit">
                      {tc("delete")}
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {invitations.length > 0 && (
        <div className="border-t border-gray-100 pt-5">
          <h3 className="mb-2 font-semibold">{t("pendingInvites")}</h3>
          <ul className="divide-y divide-gray-100">
            {invitations.map((inv) => {
              const revoke = async () => {
                await revokeInvitationAction(inv.id);
              };
              return (
                <li key={inv.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-gray-400">
                      {tr(inv.role)} ·{" "}
                      {t("expires", { date: new Date(inv.expiresAt).toLocaleDateString() })}
                    </p>
                  </div>
                  <form action={revoke}>
                    <button className="text-sm text-red-600 hover:underline" type="submit">
                      {t("revoke")}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="border-t border-gray-100 pt-5">
        <h3 className="mb-3 font-semibold">{t("inviteMember")}</h3>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Email</label>
              <input className="input" name="email" type="email" required />
            </div>
            <div>
              <label className="label">Rol</label>
              <select className="input" name="role" defaultValue="STAFF">
                <option value="STAFF">{t("roleStaff")}</option>
                <option value="ADMIN">{t("roleAdmin")}</option>
              </select>
            </div>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <SubmitButton pendingText={t("sending")}>{t("sendInvite")}</SubmitButton>
        </form>

        {state?.ok && state.link && (
          <div className="mt-4 rounded-lg bg-brand-50 p-3">
            <p className="mb-2 text-sm text-brand-800">
              {t("inviteCreated")}
            </p>
            <CopyField value={state.link} />
          </div>
        )}
      </div>
    </div>
  );
}
