import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { ButtonProps } from "../types/type";

const getBgVariantStyle = (variant: ButtonProps["bgVariant"]) => {
  switch (variant) {
    case "secondary":
      return styles.bgSecondary;
    case "danger":
      return styles.bgDanger;
    case "success":
      return styles.bgSuccess;
    case "outline":
      return styles.bgOutline;
    default:
      return styles.bgPrimary;
  }
};

const getTextVariantStyle = (variant: ButtonProps["textVariant"]) => {
  switch (variant) {
    case "primary":
      return styles.textPrimary;
    case "secondary":
      return styles.textSecondary;
    case "danger":
      return styles.textDanger;
    case "success":
      return styles.textSuccess;
    default:
      return styles.textDefault;
  }
};

const CustomButton = ({
  onPress,
  title,
  bgVariant = "primary",
  textVariant = "default",
  IconLeft,
  IconRight,
  style,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, getBgVariantStyle(bgVariant), style]}
      {...props}
    >
      {IconLeft && <IconLeft />}
      <Text style={[styles.buttonText, getTextVariantStyle(textVariant)]}>
        {title}
      </Text>
      {IconRight && <IconRight />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bgPrimary: {
    backgroundColor: 'orange',
  },
  bgSecondary: {
    backgroundColor: '#6B7280', // Adjust to match Tailwind's gray-500
  },
  bgDanger: {
    backgroundColor: '#EF4444', // Adjust to match Tailwind's red-500
  },
  bgSuccess: {
    backgroundColor: '#10B981', // Adjust to match Tailwind's green-500
  },
  bgOutline: {
    backgroundColor: 'transparent',
    borderColor: '#D1D5DB', // Adjust to match Tailwind's neutral-300
    borderWidth: 0.5,
  },
  textPrimary: {
    color: '#000000',
  },
  textSecondary: {
    color: '#F3F4F6', // Adjust to match Tailwind's gray-100
  },
  textDanger: {
    color: '#FECACA', // Adjust to match Tailwind's red-100
  },
  textSuccess: {
    color: '#D1FAE5', // Adjust to match Tailwind's green-100
  },
  textDefault: {
    color: '#FFFFFF',
  },
});

export default CustomButton;
