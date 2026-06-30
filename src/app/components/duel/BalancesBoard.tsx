"use client";

import { FC } from "react";
import { DuelBalance, DuelBalanceItem } from "@/app/models/Duel";
import Card from "../ui/Card";
import UserAvatar from "../ui/UserAvatar";

interface BalancesBoardProps {
  balances: DuelBalance[];
}

function formatName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName.charAt(0)}.`;
}

function renderItems(items: DuelBalanceItem[]): string {
  return items
    .map((i) => `${i.count} ${i.stakeEmoji}${i.stakeLabel ? ` ${i.stakeLabel}` : ""}`)
    .join(", ");
}

const BalancesBoard: FC<BalancesBoardProps> = ({ balances }) => {
  if (balances.length === 0) {
    return null;
  }

  return (
    <Card className="p-3">
      <h2 className="text-bold text-white mb-2">Qui doit quoi</h2>
      <div className="flex flex-col gap-2">
        {balances.map((b) => (
          <div
            key={b.counterpart.id}
            className="flex items-center justify-between gap-3 py-1.5 border-b border-neutral-800 last:border-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar
                src={b.counterpart.profilePictureUrl}
                name={formatName(b.counterpart)}
                size="xs"
              />
              <span className="text-sm font-medium text-white truncate">
                {formatName(b.counterpart)}
              </span>
            </div>
            <div className="flex flex-col items-end text-sm">
              {b.owedToMe.length > 0 && (
                <span className="text-success-500">
                  te doit {renderItems(b.owedToMe)}
                </span>
              )}
              {b.iOwe.length > 0 && (
                <span className="text-error-500">
                  tu dois {renderItems(b.iOwe)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default BalancesBoard;
