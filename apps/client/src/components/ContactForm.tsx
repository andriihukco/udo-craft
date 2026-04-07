"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X } from "lucide-react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Track the event
      await track("form_submit", { form: "contact", name, email });

      // Upload attachments first
      let attachmentUrls: string[] = [];
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (uploadRes.ok) {
          const { urls } = await uploadRes.json();
          attachmentUrls = urls;
        }
      }

      // Create a lead via API (as the message thread container)
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: "new",
          customer_data: {
            name,
            email,
            phone,
            company,
            source: "contact_form",
            attachments: attachmentUrls,
          },
          total_amount_cents: 0,
          // Pass message so the API can insert it into messages table
          initial_message: message || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      setSent(true);
    } catch (err) {
      console.error("Form submission error:", err);
      setError("Виникла помилка. Спробуйте ще раз або зв'яжіться з нами напряму.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-2xl">
        <p className="text-white/90 text-base font-medium">
          Дякуємо за звернення!
        </p>
        <p className="text-white/70 text-sm mt-2">
          Ми отримали вашу заявку та зв&apos;яжемося з вами найближчим часом.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4 max-w-2xl">
      <div className="space-y-1.5">
        <Label htmlFor="cf-name" className="text-white/70 text-sm">Ваше ім&apos;я *</Label>
        <Input
          id="cf-name"
          type="text"
          placeholder="Іван Петренко"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={submitting}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-white/20 focus-visible:border-white/30"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cf-email" className="text-white/70 text-sm">Email *</Label>
        <Input
          id="cf-email"
          type="email"
          placeholder="hr@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={submitting}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-white/20 focus-visible:border-white/30"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cf-phone" className="text-white/70 text-sm">Телефон *</Label>
        <Input
          id="cf-phone"
          type="tel"
          placeholder="+380 XX XXX XX XX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          disabled={submitting}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-white/20 focus-visible:border-white/30"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cf-company" className="text-white/70 text-sm">Компанія</Label>
        <Input
          id="cf-company"
          type="text"
          placeholder="Назва компанії"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          disabled={submitting}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-white/20 focus-visible:border-white/30"
        />
      </div>
      <div className="md:col-span-2 space-y-1.5">
        <Label htmlFor="cf-message" className="text-white/70 text-sm">Розкажіть про ваш проєкт</Label>
        <textarea
          id="cf-message"
          placeholder="Кількість одиниць, тип товару, терміни..."
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
          className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-colors resize-none disabled:opacity-50"
        />
      </div>

      <div className="md:col-span-2 space-y-1.5">
        <Label htmlFor="cf-files" className="text-white/70 text-sm">Завантажити файли (макети, логотипи тощо)</Label>
        <div className="relative">
          <input
            id="cf-files"
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            disabled={submitting}
            className="hidden"
          />
          <label
            htmlFor="cf-files"
            className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 hover:bg-white/5 transition-colors"
          >
            <Upload className="w-8 h-8 text-white/40 mb-2" />
            <p className="text-white/70 text-sm font-medium">Натисніть або перетягніть файли</p>
            <p className="text-white/50 text-xs mt-1">Макети, логотипи, зображення...</p>
          </label>

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
                  <span className="text-white/70 text-xs truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    className="text-white/50 hover:text-white/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="md:col-span-2">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="md:col-span-2">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-primary hover:bg-primary/90 text-white font-bold px-8 rounded-full disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Надсилаємо...
            </>
          ) : (
            "Надіслати"
          )}
        </Button>
      </div>
    </form>
  );
}
