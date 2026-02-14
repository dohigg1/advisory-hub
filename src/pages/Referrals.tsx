import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Gift, Share2, Users, DollarSign, Check, Mail, Twitter, Linkedin, ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } } };

const MOCK_REFERRAL_LINK = "https://app.advisoryhub.io/ref/abc123xyz";

const MOCK_STATS = [
  {
    label: "Total Referrals",
    value: 24,
    change: "+12%",
    icon: Users,
    gradient: "from-indigo-500/10 to-indigo-500/5",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    label: "Active",
    value: 8,
    change: "+3",
    icon: Gift,
    gradient: "from-violet-500/10 to-violet-500/5",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    label: "Converted",
    value: 14,
    change: "+5",
    icon: Share2,
    gradient: "from-emerald-500/10 to-emerald-500/5",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Earnings",
    value: "$1,240",
    change: "+18%",
    icon: DollarSign,
    gradient: "from-amber-500/10 to-amber-500/5",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

const MOCK_REFERRALS = [
  {
    id: "1",
    name: "Sarah Thompson",
    email: "sarah@example.com",
    status: "converted",
    date: "Feb 10, 2026",
    reward: "$50",
  },
  {
    id: "2",
    name: "James Wilson",
    email: "james@example.com",
    status: "active",
    date: "Feb 8, 2026",
    reward: "Pending",
  },
  {
    id: "3",
    name: "Emily Chen",
    email: "emily@example.com",
    status: "converted",
    date: "Feb 5, 2026",
    reward: "$50",
  },
  {
    id: "4",
    name: "Michael Brown",
    email: "michael@example.com",
    status: "pending",
    date: "Feb 3, 2026",
    reward: "Pending",
  },
  {
    id: "5",
    name: "Lisa Anderson",
    email: "lisa@example.com",
    status: "converted",
    date: "Jan 28, 2026",
    reward: "$50",
  },
  {
    id: "6",
    name: "David Kim",
    email: "david@example.com",
    status: "active",
    date: "Jan 25, 2026",
    reward: "Pending",
  },
  {
    id: "7",
    name: "Rachel Lee",
    email: "rachel@example.com",
    status: "expired",
    date: "Jan 15, 2026",
    reward: "--",
  },
  {
    id: "8",
    name: "Tom Parker",
    email: "tom@example.com",
    status: "converted",
    date: "Jan 12, 2026",
    reward: "$50",
  },
];

const STATUS_STYLES: Record<string, string> = {
  converted: "bg-success/10 text-success",
  active: "bg-blue-50 text-blue-700",
  pending: "bg-amber-50 text-amber-700",
  expired: "bg-muted text-muted-foreground",
};

const Referrals = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(MOCK_REFERRAL_LINK);
    setCopied(true);
    toast.success("Referral link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const shareText = encodeURIComponent(
      "Check out Advisory Hub - the best way to create client assessments and capture leads!"
    );
    const shareUrl = encodeURIComponent(MOCK_REFERRAL_LINK);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      email: `mailto:?subject=${encodeURIComponent("Check out Advisory Hub")}&body=${shareText}%0A%0A${shareUrl}`,
    };

    window.open(urls[platform], "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-soft-sm">
            <Gift className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Referrals</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Invite others and earn rewards for every conversion
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_STATS.map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className="relative overflow-hidden shadow-soft-sm hover:shadow-soft-md transition-all duration-300 group border-border/60">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
              <CardContent className="relative pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg} group-hover:bg-card transition-colors`}
                  >
                    <stat.icon
                      className={`h-4 w-4 ${stat.iconColor}`}
                      strokeWidth={1.8}
                    />
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight mono">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium mt-2 text-success">
                  <ArrowUp className="h-3 w-3" />
                  <span>{stat.change} this month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Referral Link & Share */}
      <motion.div variants={item}>
        <Card className="shadow-soft-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Your referral link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={MOCK_REFERRAL_LINK}
                  readOnly
                  className="pr-20 text-[13px] bg-muted/30 font-mono"
                />
              </div>
              <Button
                variant="outline"
                className="gap-2 h-9 text-[13px] shadow-soft-sm min-w-[100px]"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-success" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground font-medium">
                Share via:
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-[12px] border-border/60 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200"
                  onClick={() => handleShare("twitter")}
                >
                  <Twitter className="h-3.5 w-3.5" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-[12px] border-border/60 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                  onClick={() => handleShare("linkedin")}
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-[12px] border-border/60 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                  onClick={() => handleShare("email")}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Button>
              </div>
            </div>

            {/* Reward info */}
            <div className="rounded-xl bg-gradient-to-r from-indigo-50/60 to-violet-50/60 border border-indigo-100/60 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    Earn $50 for each referral
                  </p>
                  <p className="text-[12px] text-muted-foreground/70 mt-0.5 leading-relaxed">
                    When someone signs up using your referral link and subscribes
                    to a paid plan, you'll receive $50 in account credit. There's
                    no limit to how many referrals you can make.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Referral History */}
      <motion.div variants={item}>
        <Card className="shadow-soft-sm border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Referral History
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold border-border/50"
              >
                {MOCK_REFERRALS.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Referral
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">
                    Reward
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_REFERRALS.map((referral) => (
                  <TableRow key={referral.id} className="border-border/30">
                    <TableCell>
                      <div className="text-[13px] font-medium">
                        {referral.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground/60">
                        {referral.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold border-0 ${
                          STATUS_STYLES[referral.status] ?? ""
                        }`}
                      >
                        {referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-[13px] font-semibold mono">
                      {referral.reward}
                    </TableCell>
                    <TableCell className="text-right text-[11px] text-muted-foreground/60">
                      {referral.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Referrals;
