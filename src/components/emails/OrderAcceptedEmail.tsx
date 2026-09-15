import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface OrderAcceptedEmailProps {
  customerName: string;
  orderId: string;
}

export const OrderAcceptedEmail = ({
  customerName,
  orderId,
}: OrderAcceptedEmailProps) => {
  return (
    <Html>
      <Head>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,400&family=Manrope:wght@300;400;500&display=swap');
          `}
        </style>
      </Head>
      <Preview>Your package is ready for shipment.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={logo}>Cangday</Heading>
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>Order Accepted.</Heading>
            <Text style={text}>Dear {customerName},</Text>
            <Text style={text}>
              Your package for Order #{orderId.slice(0, 8)} is ready for shipment.
            </Text>
            <Text style={text}>
              If you have any questions, please reach out through our contact page.
            </Text>

            <div style={footerDivider} />
            <Text style={footerText}>
              Wear What Lingers.<br/>
              © {new Date().getFullYear()} Cangday. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderAcceptedEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Manrope', sans-serif",
  padding: '40px 0',
};

const container = {
  margin: '0 auto',
  width: '100%',
  maxWidth: '600px',
  border: '1px solid #eaeaea',
  backgroundColor: '#ffffff',
};

const headerSection = {
  padding: '32px 48px',
  backgroundColor: '#120D0A',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0',
  fontFamily: "'Fraunces', serif",
  fontSize: '28px',
  fontWeight: '500',
  color: '#F5EFE6',
  letterSpacing: '0.05em',
};

const contentSection = {
  padding: '48px',
};

const heading = {
  margin: '0 0 24px',
  fontFamily: "'Fraunces', serif",
  fontSize: '24px',
  fontWeight: '400',
  color: '#000000',
};

const text = {
  margin: '0 0 16px',
  fontSize: '15px',
  lineHeight: '24px',
  fontWeight: '300',
  color: '#333333',
};

const footerDivider = {
  marginTop: '48px',
  marginBottom: '24px',
  borderTop: '1px solid #eaeaea',
};

const footerText = {
  margin: '0',
  fontSize: '12px',
  lineHeight: '20px',
  color: '#999999',
  textAlign: 'center' as const,
};
