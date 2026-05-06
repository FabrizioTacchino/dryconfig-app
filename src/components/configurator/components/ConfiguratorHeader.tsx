
import React from 'react';

interface ConfiguratorHeaderProps {
  onBackNavigation: () => void;
  backButtonText: string;
  pageTitle: string;
  pageDescription: string;
}

const ConfiguratorHeader = ({
  onBackNavigation,
  backButtonText,
  pageTitle,
  pageDescription
}: ConfiguratorHeaderProps) => {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold tracking-tight">
        {pageTitle}
      </h1>
      <p className="text-muted-foreground text-sm mt-1">
        {pageDescription}
      </p>
    </div>
  );
};

export default ConfiguratorHeader;
