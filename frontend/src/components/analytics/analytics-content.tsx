"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionsChart } from "@/components/dashboard/questions-chart";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const categoryData = [
  { name: "Finance", value: 35 },
  { name: "Marketing", value: 28 },
  { name: "HR", value: 20 },
  { name: "Tech", value: 12 },
  { name: "Custom", value: 5 },
];

export function AnalyticsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Análise detalhada dos dados do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionsChart />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Atividade Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityChart />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Questões por Categoria (Barras)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="#E14840" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
