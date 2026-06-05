"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { PaoProvider } from "./pao-provider";
import { DiscordLogin } from "./auth-gate";
import { ClaimIdentity } from "./claim-identity";
import { Dashboard } from "./dashboard";
import { Icon } from "./icon";
import type { Person, PersonRow } from "@/lib/types";

type Status = "loading" | "login" | "claim" | "app";

function toPerson(r: PersonRow): Person {
  return {
    id: r.id,
    nick: r.nick,
    real: r.real ?? "",
    auth_id: r.auth_id ?? null,
    discord_id: r.discord_id ?? null,
    avatar_url: r.avatar_url ?? null,
  };
}

export function AppRoot() {
  const [status, setStatus] = useState<Status>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Person | null>(null);

  useEffect(() => {
    let mounted = true;

    // ตัดสินสถานะจาก session: ไม่มี → login; มีแต่ยังไม่ผูกชื่อ → claim; ผูกแล้ว → app
    async function resolve(sess: Session | null) {
      if (!mounted) return;
      setSession(sess);
      if (!sess) {
        setProfile(null);
        setStatus("login");
        return;
      }
      try {
        const { data } = await supabase
          .from("people")
          .select("*")
          .eq("auth_id", sess.user.id)
          .maybeSingle();
        if (!mounted) return;
        if (data) {
          setProfile(toPerson(data as PersonRow));
          setStatus("app");
        } else {
          // ล็อกอินแล้วแต่ยังไม่ได้เลือกชื่อ → หน้า claim
          setStatus("claim");
        }
      } catch {
        if (mounted) setStatus("claim");
      }
    }

    // อ่าน token จาก #fragment เอง (implicit OAuth) แล้วตั้ง session ให้ชัวร์
    // — ไม่พึ่ง auto-detect อย่างเดียว (บางครั้งไม่ทำงานบน production)
    async function init() {
      try {
        if (
          typeof window !== "undefined" &&
          window.location.hash.includes("access_token")
        ) {
          const p = new URLSearchParams(window.location.hash.slice(1));
          const access_token = p.get("access_token");
          const refresh_token = p.get("refresh_token");
          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            // ล้าง token ออกจาก URL (ไม่ให้ค้าง/หลุด)
            window.history.replaceState(
              {},
              "",
              window.location.pathname + window.location.search,
            );
            if (!error) {
              await resolve(data.session);
              return;
            }
          }
        }
        const { data } = await supabase.auth.getSession();
        await resolve(data.session);
      } catch {
        if (mounted) setStatus("login");
      }
    }
    void init();

    // รับทุก event (SIGNED_IN/SIGNED_OUT/INITIAL_SESSION/TOKEN_REFRESHED)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      void resolve(sess);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="app">
        <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
          <div
            className="appear"
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(150deg,#10b981,#047857)",
              boxShadow: "0 8px 22px rgba(5,150,105,.32)",
            }}
          >
            <Icon name="target" size={34} color="#fff" sw={1.8} />
          </div>
        </div>
      </div>
    );
  }

  if (status === "claim" && session) {
    return (
      <ClaimIdentity
        session={session}
        onClaimed={(p) => {
          setProfile(p);
          setStatus("app");
        }}
        onLogout={() => {
          void supabase.auth.signOut();
        }}
      />
    );
  }

  if (status === "app" && profile) {
    return (
      <PaoProvider myProfile={profile} onLogout={() => setStatus("login")}>
        <Dashboard />
      </PaoProvider>
    );
  }

  // login (และ fallback อื่น ๆ)
  return <DiscordLogin />;
}
