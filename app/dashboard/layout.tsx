"use client"
import SideNav from "@/components/sideNav";
import { authHeaders, getToken } from "@/helpers/helpers";
import { Board, Team, User } from "@/structs/types";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import MyContext from "./context";


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
                const teams = await Promise.all(
                    user.teams.map(async (tid): Promise<Team | null> => {
                        console.log(`http://localhost:8000/teams/${tid}`)
                        try {
                            const res = await fetch(`http://localhost:8000/teams/${tid}`, {
                                headers: authHeaders(),
                            });

                            if (!res.ok) {
                                throw new Error(`Failed to fetch team ${tid}: ${res.status}`);
                            }

                            return await res.json();
                        } catch (err) {
                            console.error(`Error fetching team ${tid}:`, err);
                            return null;
                        }
                    })
                );

                const validTeams: Team[] = teams.filter((t): t is Team => t !== null);

                // console.log("Fetched teams:", validTeams);
                setTeams(validTeams);

            } catch (err) {
                console.error("Unexpected error:", err);
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
