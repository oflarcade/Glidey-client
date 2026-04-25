module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/.claude/'],
  modulePathIgnorePatterns: ['<rootDir>/.claude/worktrees/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@rentascooter/api$': '<rootDir>/packages/api/src',
    '^@rentascooter/api/(.*)$': '<rootDir>/packages/api/src/$1',
    '^@rentascooter/auth$': '<rootDir>/packages/auth/src',
    '^@rentascooter/auth/(.*)$': '<rootDir>/packages/auth/src/$1',
    '^@rentascooter/shared$': '<rootDir>/packages/shared/src',
    '^@rentascooter/shared/(.*)$': '<rootDir>/packages/shared/src/$1',
    '^@rentascooter/ui$': '<rootDir>/packages/ui/src',
    '^@rentascooter/ui/(.*)$': '<rootDir>/packages/ui/src/$1',
    '^@rentascooter/i18n$': '<rootDir>/packages/i18n/src',
    '^@rentascooter/i18n/(.*)$': '<rootDir>/packages/i18n/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|expo-modules-core|@expo|expo-router|@expo/vector-icons|react-native-reanimated|@react-navigation|@tanstack)/)',
  ],
};
