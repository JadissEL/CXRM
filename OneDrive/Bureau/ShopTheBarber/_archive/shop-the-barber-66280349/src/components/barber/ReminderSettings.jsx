import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Mail, MessageSquare, Phone, Save, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReminderSettings({ barberId }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    email_enabled: true,
    email_24h: true,
    email_2h: false,
    sms_enabled: false,
    sms_24h: true,
    sms_2h: true,
    whatsapp_enabled: false,
    whatsapp_24h: true,
    custom_message_24h: "Rappel: Vous avez rendez-vous demain à {time} chez {salon}. À bientôt!",
    custom_message_2h: "Rappel: Votre rendez-vous est dans 2 heures à {time}. N'oubliez pas!"
  });

  const handleSave = async () => {
    setSaving(true);
    // Simuler la sauvegarde (dans une vraie app, sauvegarder dans une entité)
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const channels = [
    { key: 'email', label: 'Email', icon: Mail, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { key: 'sms', label: 'SMS', icon: Phone, color: 'text-green-600', bgColor: 'bg-green-100' },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-600', bgColor: 'bg-emerald-100' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Rappels Automatiques</h2>
          <p className="text-slate-600">Configurez les notifications pour vos clients</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saved ? 'Enregistré!' : 'Enregistrer'}
        </Button>
      </div>

      {/* Channels */}
      <div className="grid md:grid-cols-3 gap-6">
        {channels.map((channel, i) => {
          const Icon = channel.icon;
          const enabled = settings[`${channel.key}_enabled`];
          return (
            <motion.div key={channel.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`border-2 ${enabled ? 'border-blue-200' : 'border-slate-200 opacity-60'}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 ${channel.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${channel.color}`} />
                      </div>
                      <span>{channel.label}</span>
                    </div>
                    <Switch checked={enabled} onCheckedChange={(c) => setSettings({...settings, [`${channel.key}_enabled`]: c})} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {enabled && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm">24h avant</span>
                        <Switch checked={settings[`${channel.key}_24h`]} onCheckedChange={(c) => setSettings({...settings, [`${channel.key}_24h`]: c})} />
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm">2h avant</span>
                        <Switch checked={settings[`${channel.key}_2h`]} onCheckedChange={(c) => setSettings({...settings, [`${channel.key}_2h`]: c})} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Message Templates */}
      <Card className="border-2 border-slate-200">
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Messages Personnalisés</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <strong>Variables disponibles:</strong> {'{client}'}, {'{salon}'}, {'{service}'}, {'{date}'}, {'{time}'}, {'{price}'}
          </div>
          <div>
            <Label>Message 24h avant</Label>
            <Textarea value={settings.custom_message_24h} onChange={(e) => setSettings({...settings, custom_message_24h: e.target.value})} rows={3} />
          </div>
          <div>
            <Label>Message 2h avant</Label>
            <Textarea value={settings.custom_message_2h} onChange={(e) => setSettings({...settings, custom_message_2h: e.target.value})} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="border-2 border-slate-200">
        <CardHeader><CardTitle>Aperçu du Message</CardTitle></CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-slate-700">
              {settings.custom_message_24h
                .replace('{client}', 'Jean Dupont')
                .replace('{salon}', 'Barber Shop Paris')
                .replace('{service}', 'Coupe + Barbe')
                .replace('{date}', '15 décembre 2024')
                .replace('{time}', '14:30')
                .replace('{price}', '35€')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}