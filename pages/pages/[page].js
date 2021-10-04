/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-unresolved */
import React, { lazy } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

import { flattenArray } from "@utils/helpers";

import fetcher from "@service/service-api";
import usePage from "@service/page";
import { getStrapiBaseURL } from "@service/urls";

const componentMap = {
  hero: dynamic(() => import("@components/Hero/Hero")),
  banner: dynamic(() => import("@components/Banner/Banner")),
};

const renderComponents = (components) =>
  components.map((component) => {
    const { __component } = component;
    const DynamicComponent = componentMap[__component];
    return <DynamicComponent {...component} key={"a"} />;
  });

const Page = ({ initialPage }) => {
  const { locale, query } = useRouter();
  const { page } = query;
  const { data } = usePage({ locale, page, initialPage });
  const pages = data[0];

  const { components } = pages;
  return <>{renderComponents(components)}</>;
};

export async function getStaticPaths({ locales }) {
  try {
    const arrayPages = locales.map(async (locale) => {
      const currentPages = await fetcher(
        `${getStrapiBaseURL()}pages?_locale=${locale}`
      );
      return currentPages;
    });

    const pagesResolved = await Promise.all(arrayPages);
    const pages = flattenArray(pagesResolved);
    const paths = pages.map((page) => ({
      params: { page: page.slug },
      locale: page.locale,
    }));

    return {
      paths,
      fallback: false,
    };
  } catch (e) {
    return false;
  }
}
export async function getStaticProps({ locale, params }) {
  const { page } = params;

  const initialPage = await fetcher(
    `${getStrapiBaseURL()}pages?_locale=${locale}&slug=${page}`
  );
  return { props: { initialPage }, revalidate: 10 };
}

Page.propTypes = {
  initialPage: PropTypes.arrayOf(PropTypes.object),
};

Page.defaultProps = {
  initialPage: [],
};

export default Page;
