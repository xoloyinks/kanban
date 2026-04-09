"use client"
import SideNav from "@/components/sideNav";
import { authHeaders, getToken } from "@/helpers/helpers";
import { Board, Team, User } from "@/structs/types";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import MyContext, { UserData } from "./context";


export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const [user, setUser] = useState<User | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [boards, setBoards] = useState<Board[]>([]);
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false);


    const router = useRouter();
    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        if (!mounted) return;
        const token = getToken(), ud = localStorage.getItem("user");

        if (!token || !ud) { router.push("/login"); return; }
        setUser(JSON.parse(ud));
    }, [mounted, router]);

    useEffect(() => {
        if (!user) return;

        (async () => {
            setLoading(true);
            try {
                const res = await fetch("http://localhost:8000/teams", {
                    headers: authHeaders(),
                });

                if (!res.ok) {
                    throw new Error(`Request failed: ${res.status}`);
                }

                const tl: Team[] = await res.json().then((d) => Array.isArray(d) ? d : []);
                setTeams(tl); 
            } catch (err) {
                console.error("Failed to fetch teams:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [user, router]);

    if (!mounted) return null;

    return (
        <section
            lang="en"
            className={`h-full antialiased flex`}
        >
            <SideNav
                user={user}
                teams={teams}
                boards={boards}
                selectedTeam={selectedTeam}
                onSelectTeam={setSelectedTeam}
                collapsed={collapsed}
                onCollapse={setCollapsed}
            />
            <main className="flex-1">
                <MyContext>
                    {children}
                </MyContext>
            </main>
        </section>
    );
}
