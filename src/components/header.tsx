"use client";

import { useState } from "react";
import { usePao } from "./pao-provider";
import { colorForNick } from "@/lib/calc";
import { Avatar } from "./primitives";
import { Icon } from "./icon";

export function Header({ subtitle }: { subtitle?: string }) {
  const { setPeopleOpen, setShareOpen, myNick, myAvatar } = usePao();
  const [avatarBroken, setAvatarBroken] = useState(false);
  return (
    <header
      className="between"
      style={{
        padding: "16px 18px 12px",
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "var(--bg)",
      }}
    >
      <div className="row" style={{ gap: 10, minWidth: 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(150deg,#10b981,#047857)",
            flex: "0 0 auto",
          }}
        >
          <Icon name="target" size={19} color="#fff" sw={1.9} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 750,
              fontSize: 17,
              lineHeight: 1.05,
              letterSpacing: "-.01em",
            }}
          >
            เป้าเงิน
          </div>
          {subtitle && (
            <div className="muted" style={{ fontSize: 11.5 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div className="row" style={{ gap: 4, flex: "0 0 auto" }}>
        <button className="iconbtn" onClick={() => setPeopleOpen(true)} aria-label="สมาชิก">
          <Icon name="users" />
        </button>
        <button className="iconbtn" onClick={() => setShareOpen(true)} aria-label="แชร์ & ตั้งค่า">
          <Icon name="gear" />
        </button>
        <button
          onClick={() => setShareOpen(true)}
          aria-label={"บัญชีของฉัน · " + myNick}
          style={{
            marginLeft: 2,
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
          }}
        >
          {myAvatar && !avatarBroken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={myAvatar}
              alt={"โปรไฟล์ของ " + myNick}
              width={30}
              height={30}
              onError={() => setAvatarBroken(true)}
              style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <Avatar nick={myNick} color={colorForNick(myNick)} size={30} />
          )}
        </button>
      </div>
    </header>
  );
}
