'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Building, Truck, Users, Briefcase } from "lucide-react";

const stats = [
    { title: "Toplam Firma", value: "1,254", icon: Building, change: "+20.1% from last month" },
    { title: "Toplam Şoför", value: "5,832", icon: Truck, change: "+180.1% from last month" },
    { title: "Aktif Yük Talebi", value: "452", icon: Briefcase, change: "+19% from last month" },
    { title: "Personel Sayısı", value: "12", icon: Users, change: "+2 since last month" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Dashboard</h1>
            <p className="text-muted-foreground">İşte platformunuzun genel bir özeti.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">{stat.change}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
        <div>
            <h2 className="text-xl font-bold tracking-tight font-headline mt-8">Son Aktiviteler</h2>
            <Card className="mt-4">
                <CardContent className="pt-6">
                    <p className="text-muted-foreground">Son aktivite verileri burada gösterilecek.</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
