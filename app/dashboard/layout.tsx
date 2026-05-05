"use client"
import SideNav from "@/components/sideNav";
import { authHeaders, getToken } from "@/helpers/helpers";
import { Board, Team, User } from "@/structs/types";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import MyContext from "./context";
import { useGetUserQuery } from "../api/user";


export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const [user, setUser] = useState<User | undefined>(undefined);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [boards, setBoards] = useState<Board[]>([]);
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false);
    const { data } = useGetUserQuery(null);


    const router = useRouter();
    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        if (!mounted) return;
        const token = getToken()

        if (!token ) { router.push("/auth/login"); return; }
        localStorage.setItem("user", JSON.stringify(data));
        setUser(data);
    }, [mounted, router, data]);

    useEffect(() => {
        if (!user) return;

        setTeams(user.teams);
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
            <main className="flex-1 w-full">
                <MyContext>
                    {children}
                </MyContext>
            </main>
        </section>
    );
}
