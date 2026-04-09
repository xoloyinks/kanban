"use client"

import { User } from "@/structs/types"
import React, { useState } from "react"
import { createContext } from "react"

type UserContextType = [
    User | null,
    React.Dispatch<React.SetStateAction<User | null>>
];

export default function MyContext({ children }: {
    children: React.ReactNode,
}): React.ReactNode {
    
    const [userDetails, setUserDetails] = useState<User | null>(null)

    return (
        <>
            <UserData.Provider value={[userDetails, setUserDetails]}>
                {children}
            </UserData.Provider>
        </>
    )
}

export const UserData = createContext<UserContextType>([null, () => {}]);