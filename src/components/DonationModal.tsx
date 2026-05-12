import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { QRCodeCanvas } from 'qrcode.react';

const PIX_PAYLOAD = "00020126790014br.gov.bcb.pix0136a9626a8a-d030-45a7-a9f3-b63bf23db8d30217Doação CFM Mobile5204000053039865802BR5919Fernando H dos Reis6010Indaiatuba62070503***63040977";

interface DonationModalProps {
  theme: any;
  onClose: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ theme, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_PAYLOAD);
    } catch {
      const el = document.createElement('textarea');
      el.value = PIX_PAYLOAD;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={(e) => e.stopPropagation()}
        style={[styles.card, { backgroundColor: theme.card }]}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>☕</Text>
          <Text style={[styles.title, { color: theme.primary }]}>Apoie o Projeto!</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            Sua contribuição ajuda a manter o CFM gratuito e sem anúncios.
          </Text>

          <View style={[styles.qrContainer, { borderColor: theme.border }]}>
            <Text style={[styles.qrLabel, { color: theme.subText }]}>📱 Escaneie com seu banco</Text>
            <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }}>
              {/* @ts-ignore */}
              <QRCodeCanvas value={PIX_PAYLOAD} size={180} level="M" includeMargin={false} />
            </View>
            <Text style={[styles.qrHint, { color: theme.miniText }]}>Pix — Fernando H dos Reis</Text>
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { borderColor: theme.border }]} />
            <Text style={{ color: theme.miniText, paddingHorizontal: 10, fontSize: 12 }}>ou</Text>
            <View style={[styles.dividerLine, { borderColor: theme.border }]} />
          </View>

          <Text style={[styles.copyLabel, { color: theme.subText }]}>📋 Pix Copia e Cola</Text>
          <View style={[styles.pixBox, { backgroundColor: theme.pill, borderColor: theme.border }]}>
            <Text style={{ color: theme.miniText, fontSize: 10 }} numberOfLines={2}>
              {PIX_PAYLOAD.substring(0, 60)}...
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: copied ? theme.income : theme.primary }]}
            onPress={handleCopy}
          >
            <Text style={styles.copyBtnText}>
              {copied ? '✓ COPIADO!' : '📋 COPIAR CÓDIGO PIX'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.hint, { color: theme.miniText }]}>
            Abra seu banco → Pix → Pix copia e cola → cole o código
          </Text>

          <TouchableOpacity style={{ marginTop: 10, padding: 10 }} onPress={onClose}>
            <Text style={{ color: theme.miniText, fontSize: 12 }}>FECHAR</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20000,
  },
  card: {
    width: '88%',
    maxHeight: '85%',
    borderRadius: 20,
    padding: 25,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  qrContainer: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    width: '100%',
  },
  qrLabel: {
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '600',
  },
  qrHint: {
    fontSize: 11,
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    borderTopWidth: 0.5,
  },
  copyLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  pixBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  copyBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  copyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  hint: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 5,
  },
});
