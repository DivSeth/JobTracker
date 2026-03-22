"use client"

import { type ComponentPropsWithoutRef } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export const TabsList = ({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn('flex gap-1 p-1 bg-surface-container rounded-xl', className)}
    {...props}
  />
)
TabsList.displayName = 'TabsList'

export const TabsTrigger = ({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      'px-4 py-1.5 text-sm font-medium text-on-surface-muted rounded-lg transition-all',
      'hover:text-on-surface',
      'data-[state=active]:bg-surface-card data-[state=active]:text-on-surface data-[state=active]:shadow-ambient',
      className
    )}
    {...props}
  />
)
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = ({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('mt-4', className)} {...props} />
)
TabsContent.displayName = 'TabsContent'
