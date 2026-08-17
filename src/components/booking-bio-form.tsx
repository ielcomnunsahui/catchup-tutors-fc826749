import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BioDetails = {
  school: string;
  current_class: string;
  target_exam: string;
  exam_date: string;
  goals: string;
  challenges: string;
  parent_contact: string;
};

const EMPTY: BioDetails = {
  school: "", current_class: "", target_exam: "", exam_date: "",
  goals: "", challenges: "", parent_contact: "",
};

/** Final step of the booking flow: bio details captured after payment. */
export function BookingBioForm({ bookingId, onDone }: { bookingId: string; onDone?: () => void }) {
  const [bio, setBio] = useState<BioDetails>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!bio.school || !bio.current_class || !bio.target_exam) {
      toast.error("School, current class and target exam are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({ bio_details: bio, bio_completed: true })
      .eq("id", bookingId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setSaved(true);
    toast.success("Bio details saved");
    onDone?.();
  };

  if (saved) {
    return (
      <div className="rounded-2xl border bg-muted/40 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-brand-green" />
        <p className="mt-3 font-semibold">Bio details received</p>
        <p className="mt-1 text-sm text-muted-foreground">Your tutor will review them before the first session.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 text-left">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5"><Label>School</Label>
          <Input value={bio.school} onChange={(e) => setBio({ ...bio, school: e.target.value })} placeholder="e.g. Kings College" />
        </div>
        <div className="grid gap-1.5"><Label>Current class / year</Label>
          <Input value={bio.current_class} onChange={(e) => setBio({ ...bio, current_class: e.target.value })} placeholder="e.g. Year 12 / SS2" />
        </div>
        <div className="grid gap-1.5"><Label>Target exam</Label>
          <Input value={bio.target_exam} onChange={(e) => setBio({ ...bio, target_exam: e.target.value })} placeholder="e.g. IGCSE Maths" />
        </div>
        <div className="grid gap-1.5"><Label>Exam date (optional)</Label>
          <Input type="date" value={bio.exam_date} onChange={(e) => setBio({ ...bio, exam_date: e.target.value })} />
        </div>
        <div className="grid gap-1.5 sm:col-span-2"><Label>Parent / guardian contact (optional)</Label>
          <Input value={bio.parent_contact} onChange={(e) => setBio({ ...bio, parent_contact: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-1.5"><Label>Your goals</Label>
        <Textarea rows={2} value={bio.goals} onChange={(e) => setBio({ ...bio, goals: e.target.value })} placeholder="What grade or outcome are you aiming for?" />
      </div>
      <div className="grid gap-1.5"><Label>Topics you struggle with</Label>
        <Textarea rows={2} value={bio.challenges} onChange={(e) => setBio({ ...bio, challenges: e.target.value })} />
      </div>
      <Button onClick={save} disabled={saving} className="mt-1">{saving && <Loader2 className="animate-spin" />} Save bio details</Button>
    </div>
  );
}

export default BookingBioForm;
