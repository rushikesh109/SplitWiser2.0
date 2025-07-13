"use client";

import ChatBot from '@/components/chatbot';
import { Authenticated } from 'convex/react'
import React from 'react'

const MainLayout = ({children}) => {
  return (
    <Authenticated>
    <div className="container mx-auto mt-24 mb-20">{children}
       <ChatBot />
    </div>
    </Authenticated>
  )
}

export default MainLayout
