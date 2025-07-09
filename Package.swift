// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "iBurnData",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "iBurn2025APIData",
            targets: ["iBurn2025APIData"]
        ),
        .library(
            name: "iBurn2025Map",
            targets: ["iBurn2025Map"]
        ),
        .library(
            name: "iBurn2025MediaFiles",
            targets: ["iBurn2025MediaFiles"]
        ),
    ],
    dependencies: [
        // No external dependencies - pure resource bundle package
    ],
    targets: [
        .target(
            name: "iBurn2025APIData",
            dependencies: [],
            path: "data/2025/APIData",
            resources: [
                .copy("APIData.bundle")
            ]
        ),
        .target(
            name: "iBurn2025Map",
            dependencies: [],
            path: "data/2025/Map",
            resources: [
                .copy("Map.bundle")
            ]
        ),
        .target(
            name: "iBurn2025MediaFiles",
            dependencies: [],
            path: "data/2025/MediaFiles",
            resources: [
                .copy("MediaFiles.bundle")
            ]
        ),
        .testTarget(
            name: "iBurn2025APIDataTests",
            dependencies: ["iBurn2025APIData"]
        ),
        .testTarget(
            name: "iBurn2025MapTests",
            dependencies: ["iBurn2025Map"]
        ),
        .testTarget(
            name: "iBurn2025MediaFilesTests",
            dependencies: ["iBurn2025MediaFiles"]
        ),
    ]
)
